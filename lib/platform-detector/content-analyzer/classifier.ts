/**
 * 内容类型分类器
 * 根据平台和元数据判断内容类型
 */

import { PlatformType, ContentType, PlatformMetadata } from '../../../types'

/**
 * 分类器配置
 */
export interface ClassifierConfig {
  enableHeuristicRules?: boolean
  enableMLClassification?: boolean
  confidenceThreshold?: number
}

/**
 * 分类规则接口
 */
interface ClassificationRule {
  platform: PlatformType
  patterns?: string[]
  metadataPatterns?: {
    title?: string[]
    description?: string[]
  }
  contentType: ContentType
  confidence: number
  priority: number
}

/**
 * 内容类型分类器
 */
export class ContentTypeClassifier {
  private config: Required<ClassifierConfig>
  private rules: ClassificationRule[]

  constructor(config: ClassifierConfig = {}) {
    this.config = {
      enableHeuristicRules: true,
      enableMLClassification: false,
      confidenceThreshold: 0.6,
      ...config
    }

    this.rules = this.getDefaultRules()
  }

  /**
   * 分类内容类型
   * @param platform 平台类型
   * @param metadata 元数据
   * @returns 内容类型
   */
  classify(platform: PlatformType, metadata: PlatformMetadata): ContentType {
    // 1. 应用平台特定规则
    const platformResult = this.applyPlatformRules(platform, metadata)
    if (platformResult.confidence >= this.config.confidenceThreshold) {
      return platformResult.contentType
    }

    // 2. 应用启发式规则
    if (this.config.enableHeuristicRules) {
      const heuristicResult = this.applyHeuristicRules(platform, metadata)
      if (heuristicResult.confidence >= this.config.confidenceThreshold) {
        return heuristicResult.contentType
      }
    }

    // 3. 降级为通用类型
    return 'generic'
  }

  /**
   * 应用平台特定规则
   */
  private applyPlatformRules(
    platform: PlatformType,
    metadata: PlatformMetadata
  ): { contentType: ContentType; confidence: number } {
    // 查找匹配的平台规则
    const platformRules = this.rules.filter(rule => rule.platform === platform)

    for (const rule of platformRules) {
      // 检查URL模式匹配
      if (rule.patterns && metadata.rawData?.url) {
        for (const pattern of rule.patterns) {
          const regex = new RegExp(pattern, 'i')
          if (regex.test(metadata.rawData.url)) {
            return {
              contentType: rule.contentType,
              confidence: rule.confidence
            }
          }
        }
      }

      // 检查元数据模式匹配
      if (rule.metadataPatterns) {
        let matches = 0
        let total = 0

        if (rule.metadataPatterns.title && metadata.title) {
          total++
          for (const pattern of rule.metadataPatterns.title) {
            const regex = new RegExp(pattern, 'i')
            if (regex.test(metadata.title)) {
              matches++
              break
            }
          }
        }

        if (rule.metadataPatterns.description && metadata.description) {
          total++
          for (const pattern of rule.metadataPatterns.description) {
            const regex = new RegExp(pattern, 'i')
            if (regex.test(metadata.description)) {
              matches++
              break
            }
          }
        }

        if (total > 0 && matches / total >= 0.5) {
          return {
            contentType: rule.contentType,
            confidence: rule.confidence * (matches / total)
          }
        }
      }

      // 如果没有模式匹配，使用默认规则
      return {
        contentType: rule.contentType,
        confidence: rule.confidence * 0.8 // 降低置信度
      }
    }

    // 没有找到平台规则
    return {
      contentType: 'generic',
      confidence: 0.1
    }
  }

  /**
   * 应用启发式规则
   */
  private applyHeuristicRules(
    platform: PlatformType,
    metadata: PlatformMetadata
  ): { contentType: ContentType; confidence: number } {
    const heuristics: Array<{
      test: (platform: PlatformType, metadata: PlatformMetadata) => boolean
      contentType: ContentType
      confidence: number
    }> = [
      // 视频相关启发式
      {
        test: (_, meta) =>
          meta.duration !== undefined && meta.duration > 0,
        contentType: 'video',
        confidence: 0.9
      },
      {
        test: (_, meta) =>
          (meta.title?.toLowerCase().includes('video') ?? false) ||
          (meta.title?.toLowerCase().includes('watch') ?? false),
        contentType: 'video',
        confidence: 0.7
      },

      // 文章相关启发式
      {
        test: (_, meta) =>
          meta.wordCount !== undefined && meta.wordCount > 500,
        contentType: 'article',
        confidence: 0.8
      },
      {
        test: (_, meta) =>
          (meta.title?.toLowerCase().includes('blog') ?? false) ||
          (meta.title?.toLowerCase().includes('article') ?? false) ||
          (meta.title?.toLowerCase().includes('post') ?? false),
        contentType: 'article',
        confidence: 0.7
      },

      // 代码相关启发式
      {
        test: (_, meta) =>
          (meta.title?.toLowerCase().includes('github') ?? false) ||
          (meta.title?.toLowerCase().includes('repo') ?? false) ||
          (meta.title?.toLowerCase().includes('code') ?? false),
        contentType: 'code_repository',
        confidence: 0.8
      },
      {
        test: (_, meta) =>
          (meta.description?.toLowerCase().includes('api') ?? false) ||
          (meta.description?.toLowerCase().includes('documentation') ?? false),
        contentType: 'documentation',
        confidence: 0.7
      },

      // 讨论相关启发式
      {
        test: (_, meta) =>
          meta.title?.toLowerCase().includes('discussion') ||
          meta.title?.toLowerCase().includes('question') ||
          meta.title?.toLowerCase().includes('answer'),
        contentType: 'discussion',
        confidence: 0.7
      },

      // 图片相关启发式
      {
        test: (_, meta) =>
          meta.title?.toLowerCase().includes('gallery') ||
          meta.title?.toLowerCase().includes('photo') ||
          meta.title?.toLowerCase().includes('image'),
        contentType: 'image_gallery',
        confidence: 0.7
      }
    ]

    // 应用启发式规则
    for (const heuristic of heuristics) {
      if (heuristic.test(platform, metadata)) {
        return {
          contentType: heuristic.contentType,
          confidence: heuristic.confidence
        }
      }
    }

    // 没有匹配的启发式规则
    return {
      contentType: 'generic',
      confidence: 0.3
    }
  }

  /**
   * 获取默认规则
   */
  private getDefaultRules(): ClassificationRule[] {
    return [
      // YouTube
      {
        platform: 'youtube',
        patterns: [
          'youtube\\.com/watch',
          'youtu\\.be/',
          'youtube\\.com/shorts'
        ],
        contentType: 'video',
        confidence: 0.95,
        priority: 100
      },
      {
        platform: 'youtube',
        patterns: ['youtube\\.com/playlist'],
        contentType: 'video',
        confidence: 0.9,
        priority: 90
      },

      // B站
      {
        platform: 'bilibili',
        patterns: ['bilibili\\.com/video'],
        contentType: 'video',
        confidence: 0.95,
        priority: 100
      },
      {
        platform: 'bilibili',
        patterns: ['bilibili\\.com/read'],
        contentType: 'article',
        confidence: 0.9,
        priority: 90
      },

      // Twitter
      {
        platform: 'twitter',
        patterns: ['twitter\\.com/.*/status', 'x\\.com/.*/status'],
        contentType: 'tweet',
        confidence: 0.95,
        priority: 100
      },

      // Medium
      {
        platform: 'medium',
        patterns: ['medium\\.com'],
        contentType: 'article',
        confidence: 0.9,
        priority: 100
      },

      // 知乎
      {
        platform: 'zhihu',
        patterns: ['zhihu\\.com/question'],
        contentType: 'discussion',
        confidence: 0.9,
        priority: 100
      },
      {
        platform: 'zhihu',
        patterns: ['zhuanlan\\.zhihu\\.com'],
        contentType: 'article',
        confidence: 0.9,
        priority: 90
      },
      {
        platform: 'zhihu',
        patterns: ['zhihu\\.com/zvideo'],
        contentType: 'video',
        confidence: 0.9,
        priority: 80
      },

      // GitHub
      {
        platform: 'github',
        patterns: ['github\\.com/.*/.*'],
        contentType: 'code_repository',
        confidence: 0.9,
        priority: 100
      },
      {
        platform: 'github',
        patterns: ['github\\.com/.*/issues', 'github\\.com/.*/pull'],
        contentType: 'discussion',
        confidence: 0.8,
        priority: 90
      },

      // 微博
      {
        platform: 'weibo',
        patterns: ['weibo\\.com'],
        contentType: 'tweet',
        confidence: 0.9,
        priority: 100
      },

      // TikTok
      {
        platform: 'tiktok',
        patterns: ['tiktok\\.com/.*/video'],
        contentType: 'video',
        confidence: 0.95,
        priority: 100
      },

      // Reddit
      {
        platform: 'reddit',
        patterns: ['reddit\\.com/r/.*/comments'],
        contentType: 'discussion',
        confidence: 0.9,
        priority: 100
      },

      // Stack Overflow
      {
        platform: 'stackoverflow',
        patterns: ['stackoverflow\\.com/questions', 'stackoverflow\\.com/a/'],
        contentType: 'discussion',
        confidence: 0.95,
        priority: 100
      },

      // dev.to
      {
        platform: 'devto',
        patterns: ['dev\\.to'],
        contentType: 'article',
        confidence: 0.9,
        priority: 100
      },

      // Hacker News
      {
        platform: 'hackernews',
        patterns: ['news\\.ycombinator\\.com'],
        contentType: 'discussion',
        confidence: 0.9,
        priority: 100
      }
    ]
  }

  /**
   * 添加自定义规则
   */
  addRule(rule: ClassificationRule): void {
    this.rules.push(rule)
    this.rules.sort((a, b) => b.priority - a.priority)
  }

  /**
   * 获取所有规则
   */
  getRules(): ClassificationRule[] {
    return [...this.rules]
  }

  /**
   * 清除所有规则
   */
  clearRules(): void {
    this.rules = this.getDefaultRules()
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ClassifierConfig>): void {
    this.config = { ...this.config, ...config }
  }
}