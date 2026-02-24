/**
 * 平台检测服务主入口
 * 提供统一的平台检测、内容分析和处理策略决策功能
 */

import { PlatformDetectionResult, PlatformType, ContentType, ProcessingStrategy, PlatformMetadata, PlatformPreferences } from '../../types'
import { RuleManager } from './rule-manager'
import { CacheManager } from './cache'
import { MetadataExtractor } from './content-analyzer'
import { ContentTypeClassifier } from './content-analyzer/classifier'
import { StrategyDecider } from './content-analyzer/strategy-decider'

/**
 * 平台检测服务配置
 */
export interface PlatformDetectorConfig {
  cacheEnabled?: boolean
  cacheDuration?: number // 毫秒
  maxCacheSize?: number
  enableMetadataExtraction?: boolean
  timeout?: number // 毫秒
  userPreferences?: PlatformPreferences
}

/**
 * 平台检测服务主类
 */
export class PlatformDetectorService {
  private ruleManager: RuleManager
  private cacheManager: CacheManager
  private metadataExtractor: MetadataExtractor
  private contentTypeClassifier: ContentTypeClassifier
  private strategyDecider: StrategyDecider
  private config: Required<PlatformDetectorConfig>

  constructor(config: PlatformDetectorConfig = {}) {
    this.config = {
      cacheEnabled: true,
      cacheDuration: 5 * 60 * 1000, // 5分钟
      maxCacheSize: 1000,
      enableMetadataExtraction: true,
      timeout: 10000, // 10秒
      userPreferences: {
        defaultStrategies: {
          article: 'clip',
          video: 'watch_later',
          tweet: 'bookmark',
          code_repository: 'bookmark',
          documentation: 'clip',
          discussion: 'bookmark',
          image_gallery: 'bookmark',
          generic: 'clip'
        },
        enabledPlatforms: [
          'youtube', 'bilibili', 'twitter', 'medium', 'zhihu',
          'github', 'weibo', 'tiktok', 'reddit', 'stackoverflow',
          'devto', 'hackernews', 'generic'
        ],
        autoDetection: true,
        cacheDuration: 5 * 60 * 1000,
        fallbackToGeneric: true
      },
      ...config
    }

    this.ruleManager = new RuleManager()
    this.cacheManager = new CacheManager({
      enabled: this.config.cacheEnabled,
      duration: this.config.cacheDuration,
      maxSize: this.config.maxCacheSize
    })
    this.metadataExtractor = new MetadataExtractor({
      timeout: this.config.timeout
    })
    this.contentTypeClassifier = new ContentTypeClassifier()
    this.strategyDecider = new StrategyDecider(this.config.userPreferences)
  }

  /**
   * 检测URL的平台和内容类型
   * @param url 要检测的URL
   * @returns 平台检测结果
   */
  async detect(url: string): Promise<PlatformDetectionResult> {
    try {
      // 1. 规范化URL
      const normalizedUrl = this.normalizeUrl(url)

      // 2. 检查缓存
      const cachedResult = await this.cacheManager.get(normalizedUrl)
      if (cachedResult) {
        const result: PlatformDetectionResult = {
          ...cachedResult,
          metadata: cachedResult.metadata ? { ...cachedResult.metadata } : undefined
        }
        return result
      }

      // 3. 平台检测
      const platformResult = await this.ruleManager.detectPlatform(normalizedUrl)

      // 4. 元数据提取
      let metadata: PlatformMetadata | undefined
      if (this.config.enableMetadataExtraction && platformResult.platform !== 'generic') {
        try {
          metadata = await this.metadataExtractor.extract(normalizedUrl, platformResult.platform)
        } catch (error) {
          console.warn(`元数据提取失败: ${error}`)
          // 继续使用基础检测结果
        }
      }

      // 5. 内容类型分类
      const contentType = this.contentTypeClassifier.classify(
        platformResult.platform,
        metadata || {}
      )

      // 6. 处理策略决策
      const processingStrategy = this.strategyDecider.decide(contentType)

      // 7. 构建最终结果
      const result: PlatformDetectionResult = {
        platform: platformResult.platform,
        contentType,
        confidence: platformResult.confidence,
        metadata,
        processingStrategy
      }

      if (platformResult.matchedPattern) {
        result.matchedPattern = platformResult.matchedPattern
      }

      // 8. 缓存结果
      await this.cacheManager.set(normalizedUrl, result)

      return result

    } catch (error) {
      // 降级处理：返回通用类型
      return {
        platform: 'generic',
        contentType: 'generic',
        confidence: 0.1,
        error: error instanceof Error ? error.message : '未知错误',
        processingStrategy: 'clip'
      }
    }
  }

  /**
   * 批量检测URL
   * @param urls URL数组
   * @returns 检测结果数组
   */
  async detectBatch(urls: string[]): Promise<PlatformDetectionResult[]> {
    const results: PlatformDetectionResult[] = []

    // 并行检测，但限制并发数
    const batchSize = 5
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(url => this.detect(url))
      )
      results.push(...batchResults)
    }

    return results
  }

  /**
   * 获取平台检测规则
   * @returns 当前所有规则
   */
  getRules() {
    return this.ruleManager.getRules()
  }

  /**
   * 更新用户偏好设置
   * @param preferences 新的偏好设置
   */
  updatePreferences(preferences: Partial<PlatformPreferences>) {
    this.config.userPreferences = {
      ...this.config.userPreferences,
      ...preferences
    }
    this.strategyDecider = new StrategyDecider(this.config.userPreferences)
  }

  /**
   * 清除缓存
   */
  clearCache() {
    return this.cacheManager.clear()
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    return this.cacheManager.getStats()
  }

  /**
   * 规范化URL
   * @param url 原始URL
   * @returns 规范化后的URL
   */
  private normalizeUrl(url: string): string {
    try {
      // 移除URL中的hash和多余参数
      const urlObj = new URL(url)
      urlObj.hash = ''

      // 标准化协议和域名
      urlObj.protocol = urlObj.protocol.toLowerCase()
      urlObj.hostname = urlObj.hostname.toLowerCase()

      // 移除utm参数等跟踪参数
      const params = new URLSearchParams(urlObj.search)
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid']
      trackingParams.forEach(param => params.delete(param))

      urlObj.search = params.toString()

      return urlObj.toString()
    } catch {
      // 如果URL解析失败，返回原始URL
      return url.trim()
    }
  }
}

/**
 * 创建平台检测服务实例
 */
export function createPlatformDetector(config?: PlatformDetectorConfig): PlatformDetectorService {
  return new PlatformDetectorService(config)
}

/**
 * 默认导出的单例实例
 */
export const platformDetector = createPlatformDetector()

/**
 * 快捷检测函数
 */
export async function detectPlatform(url: string): Promise<PlatformDetectionResult> {
  return platformDetector.detect(url)
}

/**
 * 批量检测函数
 */
export async function detectPlatforms(urls: string[]): Promise<PlatformDetectionResult[]> {
  return platformDetector.detectBatch(urls)
}

// 重新导出所有类型和功能
export * from './export'