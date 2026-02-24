/**
 * 平台检测模块导出文件
 * 统一导出所有平台检测相关的功能
 */

// 主服务
export { PlatformDetectorService, createPlatformDetector, platformDetector } from './index'
export { detectPlatform, detectPlatforms } from './index'

// 规则管理器
export { RuleManager } from './rule-manager'

// 缓存管理器
export { CacheManager, createCacheManager } from './cache'

// 内容分析器
export { MetadataExtractor } from './content-analyzer'
export { ContentTypeClassifier } from './content-analyzer/classifier'
export { StrategyDecider } from './content-analyzer/strategy-decider'

// 平台检测器
export { YouTubeDetector, createYouTubeDetector, isYouTubeUrl, extractYouTubeVideoId } from './detectors/youtube'
export { BilibiliDetector, createBilibiliDetector, isBilibiliUrl, extractBilibiliVideoId } from './detectors/bilibili'
export { GenericDetector, createGenericDetector, isGenericUrl } from './detectors/generic'

// 类型重新导出 - 从各自文件导出
export type { PlatformDetectorConfig } from './index'
export type { RuleManagerConfig } from './rule-manager'
export type { CacheManagerConfig, CacheStats } from './cache'
export type { MetadataExtractorConfig, MetadataExtractionResult } from './content-analyzer'
export type { ClassifierConfig } from './content-analyzer/classifier'
export type { StrategyDeciderConfig, DecisionContext, StrategyDecision } from './content-analyzer/strategy-decider'

export type {
  YouTubeDetectorConfig,
  YouTubeVideoInfo
} from './detectors/youtube'

export type {
  BilibiliDetectorConfig,
  BilibiliVideoInfo
} from './detectors/bilibili'

export type {
  GenericDetectorConfig,
  WebpageInfo,
  ContentAnalysis
} from './detectors/generic'

/**
 * 平台检测工具函数
 */

/**
 * 快速检测URL平台
 * @param url 要检测的URL
 * @returns 平台类型
 */
export async function quickDetectPlatform(url: string): Promise<string> {
  const { platformDetector } = await import('./index')
  const result = await platformDetector.detect(url)
  return result.platform
}

/**
 * 判断URL是否为视频平台
 */
export async function isVideoPlatform(url: string): Promise<boolean> {
  const { platformDetector } = await import('./index')
  const result = await platformDetector.detect(url)
  return result.contentType === 'video'
}

/**
 * 判断URL是否为文章平台
 */
export async function isArticlePlatform(url: string): Promise<boolean> {
  const { platformDetector } = await import('./index')
  const result = await platformDetector.detect(url)
  return result.contentType === 'article'
}

/**
 * 获取推荐的处理策略
 */
export async function getRecommendedStrategy(url: string): Promise<string> {
  const { platformDetector } = await import('./index')
  const result = await platformDetector.detect(url)
  return result.processingStrategy || 'clip'
}

/**
 * 批量检测URL并分类
 */
export async function categorizeUrls(urls: string[]): Promise<{
  articles: string[]
  videos: string[]
  others: string[]
}> {
  const { platformDetector } = await import('./index')
  const results = await platformDetector.detectBatch(urls)

  const categorized = {
    articles: [] as string[],
    videos: [] as string[],
    others: [] as string[]
  }

  results.forEach((result, index) => {
    const url = urls[index]
    if (result.contentType === 'article') {
      categorized.articles.push(url)
    } else if (result.contentType === 'video') {
      categorized.videos.push(url)
    } else {
      categorized.others.push(url)
    }
  })

  return categorized
}

/**
 * 平台检测工具集
 */
export const platformUtils = {
  quickDetectPlatform,
  isVideoPlatform,
  isArticlePlatform,
  getRecommendedStrategy,
  categorizeUrls
}

/**
 * 默认导出平台检测服务
 */
export default platformDetector