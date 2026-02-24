/**
 * 平台检测API路由
 * POST /api/platform/detect
 */

import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse, PlatformDetectionResult } from '../../../../types'
import { platformDetector, detectPlatform, detectPlatforms } from '../../../../lib/platform-detector'

/**
 * 检测请求体
 */
interface DetectRequest {
  url?: string
  urls?: string[]
  options?: {
    enableMetadata?: boolean
    cache?: boolean
    timeout?: number
  }
}

/**
 * 检测响应体
 */
interface DetectResponse {
  result?: PlatformDetectionResult
  results?: PlatformDetectionResult[]
  cacheHit?: boolean
  processingTime: number
}

/**
 * POST 请求处理
 * 检测单个或多个URL的平台信息
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 解析请求体
    const body: DetectRequest = await request.json()

    // 验证请求
    if (!body.url && (!body.urls || body.urls.length === 0)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '必须提供url或urls参数',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // 处理单个URL
    if (body.url) {
      const result = await handleSingleUrl(body.url, body.options)
      const processingTime = Date.now() - startTime

      return NextResponse.json<ApiResponse<DetectResponse>>({
        success: true,
        data: {
          result,
          processingTime
        },
        timestamp: new Date().toISOString()
      })
    }

    // 处理多个URL
    if (body.urls && body.urls.length > 0) {
      // 限制批量处理数量
      const maxBatchSize = 10
      const urls = body.urls.slice(0, maxBatchSize)

      if (body.urls.length > maxBatchSize) {
        console.warn(`批量检测数量超过限制: ${body.urls.length} > ${maxBatchSize}`)
      }

      const results = await handleMultipleUrls(urls, body.options)
      const processingTime = Date.now() - startTime

      return NextResponse.json<ApiResponse<DetectResponse>>({
        success: true,
        data: {
          results,
          processingTime
        },
        timestamp: new Date().toISOString()
      })
    }

    // 不应该到达这里
    return NextResponse.json<ApiResponse>({
      success: false,
      error: '无效的请求',
      timestamp: new Date().toISOString()
    }, { status: 400 })

  } catch (error) {
    console.error('平台检测API错误:', error)

    return NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : '内部服务器错误',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * GET 请求处理
 * 提供API信息和健康检查
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const testUrl = url.searchParams.get('url')

    // 如果提供了测试URL，进行检测
    if (testUrl) {
      const startTime = Date.now()
      const result = await platformDetector.detect(testUrl)
      const processingTime = Date.now() - startTime

      return NextResponse.json<ApiResponse<DetectResponse>>({
        success: true,
        data: {
          result,
          processingTime
        },
        timestamp: new Date().toISOString()
      })
    }

    // 返回API信息
    const cacheStats = platformDetector.getCacheStats()

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        api: 'platform-detector',
        version: '1.0.0',
        endpoints: {
          single: 'POST /api/platform/detect',
          batch: 'POST /api/platform/detect (with urls array)',
          test: 'GET /api/platform/detect?url={url}'
        },
        cache: cacheStats,
        supportedPlatforms: [
          'youtube', 'bilibili', 'twitter', 'medium', 'zhihu',
          'github', 'weibo', 'tiktok', 'reddit', 'stackoverflow',
          'devto', 'hackernews', 'generic'
        ]
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('平台检测API信息获取错误:', error)

    return NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : '内部服务器错误',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * 处理单个URL
 */
async function handleSingleUrl(
  url: string,
  options?: DetectRequest['options']
): Promise<PlatformDetectionResult> {
  // 验证URL格式
  if (!isValidUrl(url)) {
    throw new Error('无效的URL格式')
  }

  // 配置检测选项
  const detector = options ? createConfiguredDetector(options) : platformDetector

  // 执行检测
  return detector.detect(url)
}

/**
 * 处理多个URL
 */
async function handleMultipleUrls(
  urls: string[],
  options?: DetectRequest['options']
): Promise<PlatformDetectionResult[]> {
  // 验证所有URL
  const validUrls = urls.filter(url => isValidUrl(url))

  if (validUrls.length === 0) {
    throw new Error('没有有效的URL')
  }

  // 配置检测选项
  const detector = options ? createConfiguredDetector(options) : platformDetector

  // 执行批量检测
  return detector.detectBatch(validUrls)
}

/**
 * 创建配置的检测器
 */
function createConfiguredDetector(options: NonNullable<DetectRequest['options']>) {
  const config = {
    enableMetadataExtraction: options.enableMetadata ?? true,
    cacheEnabled: options.cache ?? true,
    timeout: options.timeout
  }

  // 创建新的检测器实例
  const { createPlatformDetector } = require('../../../../lib/platform-detector')
  return createPlatformDetector(config)
}

/**
 * 验证URL格式
 */
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
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