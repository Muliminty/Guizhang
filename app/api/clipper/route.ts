/**
 * 增强剪藏API路由
 * POST /api/clipper
 * 集成平台检测，根据内容类型自动选择处理策略
 */

import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse, ClipperResult, ClipperOptions, EnhancedArticle, PlatformDetectionResult } from '@/types'
import { platformDetector } from '@/lib/platform-detector'
import { defaultClipper, ClipperServiceResult } from '@/lib/clipper'

/**
 * 增强剪藏请求体
 */
interface EnhancedClipRequest {
  url: string
  options?: ClipperOptions
  strategy?: 'auto' | 'clip' | 'watch_later' | 'bookmark'
  metadata?: {
    title?: string
    tags?: string[]
    notes?: string
  }
}

/**
 * 增强剪藏响应体
 */
interface EnhancedClipResponse {
  strategy: string
  result: ClipperResult | WatchLaterResult | BookmarkResult
  platformDetection?: PlatformDetectionResult
  processingTime: number
}

/**
 * 稍后观看结果
 */
interface WatchLaterResult {
  success: boolean
  watchLaterId?: string
  item?: {
    id: string
    url: string
    title: string
    platform: string
    addedAt: string
  }
  error?: string
}

/**
 * 书签结果
 */
interface BookmarkResult {
  success: boolean
  bookmarkId?: string
  url: string
  title?: string
  savedAt: string
  error?: string
}

/**
 * POST 请求处理
 * 增强剪藏功能
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 解析请求体
    const body: EnhancedClipRequest = await request.json()

    // 验证请求
    if (!body.url) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '必须提供url参数',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // 验证URL格式
    if (!isValidUrl(body.url)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '无效的URL格式',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // 平台检测
    const platformDetection = await platformDetector.detect(body.url)

    // 决定处理策略
    const strategy = body.strategy === 'auto' || !body.strategy
      ? platformDetection.processingStrategy || 'clip'
      : body.strategy

    // 根据策略执行相应处理
    let result: ClipperResult | WatchLaterResult | BookmarkResult

    switch (strategy) {
      case 'clip':
        result = await handleClip(body.url, body.options, platformDetection, body.metadata)
        break

      case 'watch_later':
        result = await handleWatchLater(body.url, platformDetection, body.metadata)
        break

      case 'bookmark':
        result = await handleBookmark(body.url, platformDetection, body.metadata)
        break

      default:
        return NextResponse.json<ApiResponse>({
          success: false,
          error: `不支持的处理策略: ${strategy}`,
          timestamp: new Date().toISOString()
        }, { status: 400 })
    }

    const processingTime = Date.now() - startTime

    return NextResponse.json<ApiResponse<EnhancedClipResponse>>({
      success: true,
      data: {
        strategy,
        result,
        platformDetection,
        processingTime
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('增强剪藏API错误:', error)

    return NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : '内部服务器错误',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * GET 请求处理
 * 提供API信息和状态
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const testUrl = url.searchParams.get('url')

    // 如果提供了测试URL，进行平台检测
    if (testUrl) {
      const startTime = Date.now()
      const platformDetection = await platformDetector.detect(testUrl)
      const processingTime = Date.now() - startTime

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          url: testUrl,
          platformDetection,
          recommendedStrategy: platformDetection.processingStrategy,
          processingTime
        },
        timestamp: new Date().toISOString()
      })
    }

    // 返回API信息
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        api: 'enhanced-clipper',
        version: '1.0.0',
        description: '集成平台检测的增强剪藏API',
        endpoints: {
          clip: 'POST /api/clipper',
          detect: 'GET /api/clipper?url={url}'
        },
        features: [
          '自动平台检测',
          '智能处理策略选择',
          '支持文章剪藏',
          '支持稍后观看',
          '支持书签保存'
        ]
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('剪藏API信息获取错误:', error)

    return NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : '内部服务器错误',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * 处理文章剪藏
 */
async function handleClip(
  url: string,
  options: ClipperOptions | undefined,
  platformDetection: PlatformDetectionResult,
  metadata?: EnhancedClipRequest['metadata']
): Promise<ClipperResult> {
  console.log('执行剪藏:', {
    url,
    options,
    platform: platformDetection.platform,
    contentType: platformDetection.contentType,
    metadata
  })

  try {
    // 使用剪藏服务执行实际抓取和提取
    const clipperResult = await defaultClipper.clip(url, {
      title: metadata?.title,
      tags: metadata?.tags,
      notes: metadata?.notes
    } as {
      title?: string
      tags?: string[]
      notes?: string
    })

    const article = clipperResult.article

    // 如果平台检测提供了额外的元数据，补充到文章中
    if (platformDetection.metadata) {
      // 合并平台元数据
      article.platformMetadata = {
        ...article.platformMetadata,
        ...platformDetection.metadata,
        rawData: {
          ...(article.platformMetadata?.rawData as any),
          platformDetection: platformDetection.metadata
        }
      }

      // 补充缺失的字段
      if (!article.author && platformDetection.metadata.author) {
        article.author = platformDetection.metadata.author
      }

      if (!article.publishedAt && platformDetection.metadata.publishedAt) {
        article.publishedAt = platformDetection.metadata.publishedAt
      }

      if (!article.coverImage && platformDetection.metadata.thumbnail) {
        article.coverImage = platformDetection.metadata.thumbnail
      }

      if (!article.excerpt && platformDetection.metadata.description) {
        article.excerpt = platformDetection.metadata.description
      }
    }

    // 更新处理策略
    article.processingStrategy = 'clip'

    // 添加剪藏过程的元数据
    const clipperMetadata = {
      title: article.title,
      author: article.author,
      publishedAt: article.publishedAt,
      readingTime: article.readingTime,
      wordCount: article.wordCount,
      excerpt: article.excerpt,
      coverImage: article.coverImage,
      qualityScore: article.qualityScore,
      fetchTime: clipperResult.fetchResult.fetchTime,
      extractTime: clipperResult.extractResult.extractTime,
      totalTime: clipperResult.totalTime
    } as {
      title: string
      author?: string
      publishedAt?: string
      readingTime?: number
      wordCount?: number
      excerpt?: string
      coverImage?: string
      qualityScore?: number
      fetchTime: number
      extractTime: number
      totalTime: number
    }

    return {
      success: true,
      data: article,
      metadata: clipperMetadata
    }

  } catch (error) {
    console.error('剪藏失败:', error)

    // 降级处理：返回基础信息
    const fallbackArticle: EnhancedArticle = {
      id: generateId(),
      title: metadata?.title || platformDetection.metadata?.title || '剪藏失败的文章',
      content: '剪藏过程中出现错误，无法获取文章内容。',
      url,
      domain: extractDomain(url),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isStarred: false,
      isArchived: false,
      platform: platformDetection.platform,
      contentType: platformDetection.contentType,
      processingStrategy: 'clip',
      publishedAt: new Date().toISOString(),
      readingTime: 1,
      wordCount: 50,
      excerpt: '剪藏过程中出现错误。',
      qualityScore: 0.1
    }

    // 添加错误信息
    if (platformDetection.metadata) {
      fallbackArticle.platformMetadata = platformDetection.metadata
    }

    return {
      success: false,
      data: fallbackArticle,
      metadata: {
        title: fallbackArticle.title,
        error: error instanceof Error ? error.message : '剪藏失败',
        fallback: true
      } as any,
      error: error instanceof Error ? error.message : '剪藏失败'
    }
  }
}

/**
 * 处理稍后观看
 */
async function handleWatchLater(
  url: string,
  platformDetection: PlatformDetectionResult,
  metadata?: EnhancedClipRequest['metadata']
): Promise<WatchLaterResult> {
  // TODO: 实现稍后观看队列逻辑
  // 这里应该调用稍后观看服务

  console.log('添加到稍后观看:', {
    url,
    platform: platformDetection.platform,
    metadata: platformDetection.metadata,
    userMetadata: metadata
  })

  // 模拟稍后观看结果
  const watchLaterId = generateId()

  return {
    success: true,
    watchLaterId,
    item: {
      id: watchLaterId,
      url,
      title: metadata?.title || platformDetection.metadata?.title || '未命名内容',
      platform: platformDetection.platform,
      addedAt: new Date().toISOString()
    }
  }
}

/**
 * 处理书签保存
 */
async function handleBookmark(
  url: string,
  platformDetection: PlatformDetectionResult,
  metadata?: EnhancedClipRequest['metadata']
): Promise<BookmarkResult> {
  // TODO: 实现书签保存逻辑

  console.log('保存为书签:', {
    url,
    platform: platformDetection.platform,
    metadata: platformDetection.metadata,
    userMetadata: metadata
  })

  // 模拟书签结果
  const bookmarkId = generateId()

  return {
    success: true,
    bookmarkId,
    url,
    title: metadata?.title || platformDetection.metadata?.title || '未命名书签',
    savedAt: new Date().toISOString()
  }
}

/**
 * 验证URL格式
 */
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)

    // 只允许HTTP/HTTPS协议
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return false
    }

    // 检查是否为本地地址或私有地址
    const hostname = urlObj.hostname.toLowerCase()
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname === '[::1]'
    ) {
      return false
    }

    // 检查私有IP地址
    if (/^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/.test(hostname)) {
      return false
    }

    // 基本长度检查
    if (url.length > 2048) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * 从URL提取域名
 */
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

/**
 * 生成唯一ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * OPTIONS 请求处理（CORS）
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}