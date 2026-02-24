/**
 * 简化版平台检测服务
 * 避免复杂的TypeScript类型问题
 */

import { PlatformType, ContentType, ProcessingStrategy, PlatformMetadata } from '../../types'

/**
 * 简化的平台检测结果
 */
export interface SimpleDetectionResult {
  platform: PlatformType
  contentType: ContentType
  confidence: number
  processingStrategy?: ProcessingStrategy
  metadata?: Record<string, any>
}

/**
 * 平台规则
 */
interface PlatformRule {
  platform: PlatformType
  patterns: RegExp[]
  contentType: ContentType
  priority: number
}

/**
 * 简化平台检测器
 */
export class SimplePlatformDetector {
  private rules: PlatformRule[]
  private cache: Map<string, SimpleDetectionResult> = new Map()

  constructor() {
    this.rules = this.getDefaultRules()
  }

  /**
   * 获取默认规则
   */
  private getDefaultRules(): PlatformRule[] {
    return [
      // YouTube
      {
        platform: 'youtube',
        patterns: [
          /youtube\.com\/watch\?v=[\w-]{11}/,
          /youtu\.be\/[\w-]{11}/
        ],
        contentType: 'video',
        priority: 100
      },
      // B站
      {
        platform: 'bilibili',
        patterns: [
          /bilibili\.com\/video\/[A-Za-z0-9]+/,
          /b23\.tv\/[A-Za-z0-9]+/
        ],
        contentType: 'video',
        priority: 95
      },
      // Twitter
      {
        platform: 'twitter',
        patterns: [
          /twitter\.com\/\w+\/status\/\d+/,
          /x\.com\/\w+\/status\/\d+/
        ],
        contentType: 'tweet',
        priority: 90
      },
      // Medium
      {
        platform: 'medium',
        patterns: [
          /medium\.com\/@[\w.-]+\/[\w-]+/
        ],
        contentType: 'article',
        priority: 85
      },
      // 知乎
      {
        platform: 'zhihu',
        patterns: [
          /zhihu\.com\/question\/\d+/,
          /zhuanlan\.zhihu\.com\/p\/\d+/
        ],
        contentType: 'article',
        priority: 80
      },
      // GitHub
      {
        platform: 'github',
        patterns: [
          /github\.com\/[\w.-]+\/[\w.-]+/
        ],
        contentType: 'code_repository',
        priority: 75
      }
    ]
  }

  /**
   * 检测URL
   */
  async detect(url: string): Promise<SimpleDetectionResult> {
    // 检查缓存
    const cached = this.cache.get(url)
    if (cached) {
      return { ...cached }
    }

    // 规范化URL
    const normalizedUrl = this.normalizeUrl(url)

    // 匹配规则
    for (const rule of this.rules) {
      for (const pattern of rule.patterns) {
        if (pattern.test(normalizedUrl)) {
          const result: SimpleDetectionResult = {
            platform: rule.platform,
            contentType: rule.contentType,
            confidence: 0.9,
            processingStrategy: this.getProcessingStrategy(rule.contentType)
          }

          // 缓存结果
          this.cache.set(url, { ...result })

          return result
        }
      }
    }

    // 默认返回通用类型
    const defaultResult: SimpleDetectionResult = {
      platform: 'generic',
      contentType: 'generic',
      confidence: 0.1,
      processingStrategy: 'clip'
    }

    this.cache.set(url, { ...defaultResult })
    return defaultResult
  }

  /**
   * 批量检测
   */
  async detectBatch(urls: string[]): Promise<SimpleDetectionResult[]> {
    const results: SimpleDetectionResult[] = []
    for (const url of urls) {
      results.push(await this.detect(url))
    }
    return results
  }

  /**
   * 根据内容类型获取处理策略
   */
  private getProcessingStrategy(contentType: ContentType): ProcessingStrategy {
    switch (contentType) {
      case 'article':
      case 'documentation':
        return 'clip'
      case 'video':
        return 'watch_later'
      case 'tweet':
      case 'code_repository':
      case 'discussion':
      case 'image_gallery':
        return 'bookmark'
      default:
        return 'clip'
    }
  }

  /**
   * 规范化URL
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      urlObj.hash = ''
      urlObj.protocol = urlObj.protocol.toLowerCase()
      urlObj.hostname = urlObj.hostname.toLowerCase()
      return urlObj.toString()
    } catch {
      return url.toLowerCase()
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * 获取缓存大小
   */
  getCacheSize(): number {
    return this.cache.size
  }
}

/**
 * 创建简化检测器实例
 */
export function createSimpleDetector(): SimplePlatformDetector {
  return new SimplePlatformDetector()
}

/**
 * 默认实例
 */
export const simpleDetector = createSimpleDetector()

/**
 * 快捷函数
 */
export async function simpleDetect(url: string): Promise<SimpleDetectionResult> {
  return simpleDetector.detect(url)
}

export async function simpleDetectBatch(urls: string[]): Promise<SimpleDetectionResult[]> {
  return simpleDetector.detectBatch(urls)
}