/**
 * 剪藏核心服务
 * 整合网页抓取和内容提取功能
 */

import { WebFetcher, FetchOptions, FetchResult, fetchWebPage } from './fetcher'
import { ContentExtractor, ExtractOptions, ExtractResult, extractContent } from './extractor'
import { EnhancedArticle, PlatformType, PlatformMetadata } from '@/types'

/**
 * 剪藏配置
 */
export interface ClipperConfig {
  /** 抓取配置 */
  fetch?: FetchOptions
  /** 提取配置 */
  extract?: ExtractOptions
  /** 是否启用缓存 */
  enableCache?: boolean
  /** 缓存TTL（毫秒） */
  cacheTTL?: number
}

/**
 * 剪藏结果
 */
export interface ClipperServiceResult {
  /** 抓取结果 */
  fetchResult: FetchResult
  /** 提取结果 */
  extractResult: ExtractResult
  /** 转换后的文章数据 */
  article: EnhancedArticle
  /** 总耗时（毫秒） */
  totalTime: number
}

/**
 * 剪藏服务
 */
export class ClipperService {
  private fetcher: WebFetcher
  private extractor: ContentExtractor
  private config: Required<ClipperConfig>

  constructor(config: ClipperConfig = {}) {
    this.config = {
      fetch: {},
      extract: {},
      enableCache: true,
      cacheTTL: 5 * 60 * 1000, // 5分钟
      ...config
    }

    this.fetcher = new WebFetcher(this.config.fetch)
    this.extractor = new ContentExtractor(this.config.extract)

    if (!this.config.enableCache) {
      this.fetcher.clearCache()
    } else {
      this.fetcher.setCacheTTL(this.config.cacheTTL)
    }
  }

  /**
   * 执行剪藏
   */
  async clip(url: string, userMetadata?: {
    title?: string
    tags?: string[]
    notes?: string
  }): Promise<ClipperServiceResult> {
    const startTime = Date.now()

    try {
      // 1. 抓取网页
      const fetchResult = await this.fetcher.fetch(url)

      // 2. 提取内容
      const extractResult = await this.extractor.extract(fetchResult)

      // 3. 转换为文章数据
      const article = this.createArticle(
        url,
        fetchResult,
        extractResult,
        userMetadata
      )

      const totalTime = Date.now() - startTime

      return {
        fetchResult,
        extractResult,
        article,
        totalTime
      }

    } catch (error) {
      console.error('剪藏失败:', error)
      throw error
    }
  }

  /**
   * 批量剪藏
   */
  async clipBatch(
    urls: string[],
    userMetadataList?: Array<{
      title?: string
      tags?: string[]
      notes?: string
    }>
  ): Promise<ClipperServiceResult[]> {
    const results: ClipperServiceResult[] = []

    // 并行处理，但限制并发数
    const concurrency = 3
    const batches = []

    for (let i = 0; i < urls.length; i += concurrency) {
      const batchUrls = urls.slice(i, i + concurrency)
      const batchMetadata = userMetadataList?.slice(i, i + concurrency)

      const batchPromises = batchUrls.map((url, index) => {
        const metadata = batchMetadata?.[index]
        return this.clip(url, metadata)
      })

      const batchResults = await Promise.allSettled(batchPromises)

      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          console.error('批量剪藏失败:', result.reason)
        }
      })

      // 批次间延迟，避免过于频繁请求
      if (i + concurrency < urls.length) {
        await this.delay(1000)
      }
    }

    return results
  }

  /**
   * 创建文章数据
   */
  private createArticle(
    url: string,
    fetchResult: FetchResult,
    extractResult: ExtractResult,
    userMetadata?: {
      title?: string
      tags?: string[]
      notes?: string
    }
  ): EnhancedArticle {
    const now = new Date().toISOString()

    // 使用用户提供的标题，否则使用提取的标题
    const title = userMetadata?.title?.trim() || extractResult.title

    // 构建文章数据
    const article: EnhancedArticle = {
      id: this.generateId(),
      title,
      content: extractResult.contentMarkdown,
      url: fetchResult.finalUrl,
      domain: this.extractDomain(fetchResult.finalUrl),
      createdAt: now,
      updatedAt: now,
      isStarred: false,
      isArchived: false,
      platform: this.detectPlatform(fetchResult.finalUrl),
      contentType: 'article',
      processingStrategy: 'clip',
      wordCount: extractResult.wordCount,
      readingTime: extractResult.readingTime,
      excerpt: extractResult.excerpt || extractResult.metadata.og?.description,
      coverImage: extractResult.coverImage,
      language: extractResult.language,
      qualityScore: extractResult.qualityScore
    } as EnhancedArticle

    // 可选字段
    if (extractResult.author) {
      article.author = extractResult.author
    }

    if (extractResult.publishedAt) {
      article.publishedAt = extractResult.publishedAt
    } else {
      article.publishedAt = now
    }

    if (userMetadata?.tags && userMetadata.tags.length > 0) {
      article.tags = userMetadata.tags
    }

    if (userMetadata?.notes) {
      article.notes = userMetadata.notes
    }

    // 存储原始元数据
    article.platformMetadata = {
      title: extractResult.title,
      author: extractResult.author,
      description: extractResult.excerpt,
      thumbnail: extractResult.coverImage,
      publishedAt: extractResult.publishedAt,
      rawData: {
        fetch: {
          url: fetchResult.url,
          finalUrl: fetchResult.finalUrl,
          statusCode: fetchResult.statusCode,
          contentType: fetchResult.contentType,
          fetchTime: fetchResult.fetchTime
        },
        extract: {
          qualityScore: extractResult.qualityScore,
          warnings: extractResult.warnings,
          extractTime: extractResult.extractTime,
          metadata: extractResult.metadata
        }
      }
    } as PlatformMetadata

    return article
  }

  /**
   * 检测平台
   */
  private detectPlatform(url: string): PlatformType {
    const domain = this.extractDomain(url).toLowerCase()

    const platformPatterns: Record<string, RegExp> = {
      'youtube': /(youtube\.com|youtu\.be)/,
      'bilibili': /bilibili\.com/,
      'twitter': /(twitter\.com|x\.com)/,
      'medium': /medium\.com/,
      'zhihu': /zhihu\.com/,
      'github': /github\.com/,
      'weibo': /weibo\.com/
    }

    for (const [platform, pattern] of Object.entries(platformPatterns)) {
      if (pattern.test(domain)) {
        return platform as PlatformType
      }
    }

    return 'generic'
  }

  /**
   * 提取域名
   */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  }

  /**
   * 生成ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.fetcher.clearCache()
  }

  /**
   * 更新配置
   */
  updateConfig(config: ClipperConfig): void {
    this.config = { ...this.config, ...config }

    if (config.fetch) {
      this.fetcher = new WebFetcher(this.config.fetch)
    }

    if (config.extract) {
      this.extractor.updateOptions(this.config.extract)
    }

    if (config.enableCache !== undefined) {
      if (!this.config.enableCache) {
        this.fetcher.clearCache()
      }
    }

    if (config.cacheTTL !== undefined) {
      this.fetcher.setCacheTTL(this.config.cacheTTL)
    }
  }
}

/**
 * 默认剪藏服务实例
 */
export const defaultClipper = new ClipperService()

/**
 * 便捷函数：剪藏网页
 */
export async function clipWebPage(
  url: string,
  userMetadata?: {
    title?: string
    tags?: string[]
    notes?: string
  },
  config?: ClipperConfig
): Promise<ClipperServiceResult> {
  const clipper = config ? new ClipperService(config) : defaultClipper
  return clipper.clip(url, userMetadata)
}

// 导出所有类型和函数
export * from './fetcher'
export * from './extractor'