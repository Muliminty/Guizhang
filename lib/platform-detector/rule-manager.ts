/**
 * 平台规则管理器
 * 负责加载、管理和匹配平台检测规则
 */

import { PlatformType, ContentType, PlatformRule } from '../../types'

/**
 * 平台检测中间结果
 */
interface PlatformDetectionIntermediate {
  platform: PlatformType
  confidence: number
  matchedPattern?: string
  extractedId?: string
}

/**
 * 规则管理器配置
 */
interface RuleManagerConfig {
  rules?: PlatformRule[]
  enableDynamicLoading?: boolean
  rulesPath?: string
}

/**
 * 平台规则管理器
 */
export class RuleManager {
  private rules: PlatformRule[] = []
  private config: Required<RuleManagerConfig>

  constructor(config: RuleManagerConfig = {}) {
    this.config = {
      rules: [],
      enableDynamicLoading: false,
      rulesPath: '/config/platform-rules.json',
      ...config
    }

    this.initializeRules()
  }

  /**
   * 初始化规则
   */
  private initializeRules() {
    // 如果提供了初始规则，使用它们
    if (this.config.rules && this.config.rules.length > 0) {
      this.rules = this.config.rules
    } else {
      // 否则使用内置规则
      this.rules = this.getBuiltinRules()
    }

    // 按优先级排序
    this.rules.sort((a, b) => b.priority - a.priority)
  }

  /**
   * 获取内置规则
   */
  private getBuiltinRules(): PlatformRule[] {
    return [
      // YouTube
      {
        platform: 'youtube',
        patterns: [
          '^https://(?:www\\.)?youtube\\.com/watch\\?v=[\\w-]{11}',
          '^https://youtu\\.be/[\\w-]{11}',
          '^https://(?:www\\.)?youtube\\.com/shorts/[\\w-]+',
          '^https://(?:www\\.)?youtube\\.com/playlist\\?list=[\\w-]+'
        ],
        contentType: 'video',
        metadataExtractor: 'youtube',
        priority: 100,
        enabled: true,
        description: 'YouTube视频检测规则'
      },

      // B站
      {
        platform: 'bilibili',
        patterns: [
          '^https://www\\.bilibili\\.com/video/[A-Za-z0-9]+',
          '^https://www\\.bilibili\\.com/bangumi/play/[a-z0-9]+',
          '^https://b23\\.tv/[A-Za-z0-9]+',
          '^https://(?:www\\.)?bilibili\\.com/read/[a-z0-9]+'
        ],
        contentType: 'video',
        metadataExtractor: 'bilibili',
        priority: 95,
        enabled: true,
        description: 'B站视频检测规则'
      },

      // Twitter/X
      {
        platform: 'twitter',
        patterns: [
          '^https://(?:twitter\\.com|x\\.com)/[\\w_]+/status/\\d+',
          '^https://(?:twitter\\.com|x\\.com)/[\\w_]+'
        ],
        contentType: 'tweet',
        metadataExtractor: 'twitter',
        priority: 90,
        enabled: true,
        description: 'Twitter/X推文检测规则'
      },

      // Medium
      {
        platform: 'medium',
        patterns: [
          '^https://medium\\.com/@[\\w.-]+/[\\w-]+',
          '^https://[\\w-]+\\.medium\\.com/[\\w-]+'
        ],
        contentType: 'article',
        metadataExtractor: 'medium',
        priority: 85,
        enabled: true,
        description: 'Medium文章检测规则'
      },

      // 知乎
      {
        platform: 'zhihu',
        patterns: [
          '^https://www\\.zhihu\\.com/question/\\d+',
          '^https://zhuanlan\\.zhihu\\.com/p/\\d+',
          '^https://www\\.zhihu\\.com/answer/\\d+',
          '^https://www\\.zhihu\\.com/zvideo/\\d+'
        ],
        contentType: 'article',
        metadataExtractor: 'zhihu',
        priority: 80,
        enabled: true,
        description: '知乎内容检测规则'
      },

      // GitHub
      {
        platform: 'github',
        patterns: [
          '^https://github\\.com/[\\w.-]+/[\\w.-]+',
          '^https://github\\.com/[\\w.-]+/[\\w.-]+/issues/\\d+',
          '^https://github\\.com/[\\w.-]+/[\\w.-]+/pull/\\d+',
          '^https://github\\.com/[\\w.-]+/[\\w.-]+/blob/',
          '^https://github\\.com/[\\w.-]+/[\\w.-]+/tree/'
        ],
        contentType: 'code_repository',
        metadataExtractor: 'github',
        priority: 75,
        enabled: true,
        description: 'GitHub仓库检测规则'
      },

      // 微博
      {
        platform: 'weibo',
        patterns: [
          '^https://weibo\\.com/\\d+/[A-Za-z0-9]+',
          '^https://m\\.weibo\\.cn/status/\\d+'
        ],
        contentType: 'tweet',
        metadataExtractor: 'weibo',
        priority: 70,
        enabled: true,
        description: '微博内容检测规则'
      },

      // TikTok
      {
        platform: 'tiktok',
        patterns: [
          '^https://www\\.tiktok\\.com/@[\\w.-]+/video/\\d+',
          '^https://vt\\.tiktok\\.com/[A-Za-z0-9]+'
        ],
        contentType: 'video',
        metadataExtractor: 'tiktok',
        priority: 65,
        enabled: true,
        description: 'TikTok视频检测规则'
      },

      // Reddit
      {
        platform: 'reddit',
        patterns: [
          '^https://www\\.reddit\\.com/r/[\\w]+/comments/[\\w]+',
          '^https://old\\.reddit\\.com/r/[\\w]+/comments/[\\w]+'
        ],
        contentType: 'discussion',
        metadataExtractor: 'reddit',
        priority: 60,
        enabled: true,
        description: 'Reddit讨论检测规则'
      },

      // Stack Overflow
      {
        platform: 'stackoverflow',
        patterns: [
          '^https://stackoverflow\\.com/questions/\\d+/',
          '^https://stackoverflow\\.com/a/\\d+'
        ],
        contentType: 'discussion',
        metadataExtractor: 'stackoverflow',
        priority: 55,
        enabled: true,
        description: 'Stack Overflow问答检测规则'
      },

      // dev.to
      {
        platform: 'devto',
        patterns: [
          '^https://dev\\.to/[\\w.-]+/[\\w-]+'
        ],
        contentType: 'article',
        metadataExtractor: 'devto',
        priority: 50,
        enabled: true,
        description: 'dev.to文章检测规则'
      },

      // Hacker News
      {
        platform: 'hackernews',
        patterns: [
          '^https://news\\.ycombinator\\.com/item\\?id=\\d+'
        ],
        contentType: 'discussion',
        metadataExtractor: 'hackernews',
        priority: 45,
        enabled: true,
        description: 'Hacker News讨论检测规则'
      },

      // 通用规则（最低优先级）
      {
        platform: 'generic',
        patterns: [
          '^https?://[^/]+/blog/[^/]+',
          '^https?://[^/]+/article/[^/]+',
          '^https?://[^/]+/post/[^/]+',
          '^https?://[^/]+/news/[^/]+'
        ],
        contentType: 'article',
        priority: 10,
        enabled: true,
        description: '通用博客/文章检测规则'
      }
    ]
  }

  /**
   * 检测URL的平台
   * @param url 要检测的URL
   * @returns 平台检测中间结果
   */
  async detectPlatform(url: string): Promise<PlatformDetectionIntermediate> {
    const normalizedUrl = url.trim()

    // 遍历所有启用的规则
    for (const rule of this.rules) {
      if (!rule.enabled) continue

      for (const pattern of rule.patterns) {
        try {
          const regex = new RegExp(pattern, 'i')
          const match = regex.exec(normalizedUrl)

          if (match) {
            // 提取平台特定ID
            let extractedId: string | undefined

            // 根据平台类型提取ID
            switch (rule.platform) {
              case 'youtube':
                extractedId = this.extractYouTubeId(normalizedUrl)
                break
              case 'bilibili':
                extractedId = this.extractBilibiliId(normalizedUrl)
                break
              case 'twitter':
                extractedId = this.extractTwitterId(normalizedUrl)
                break
              case 'github':
                extractedId = this.extractGitHubId(normalizedUrl)
                break
              // 其他平台可以类似处理
            }

            const result: PlatformDetectionIntermediate = {
              platform: rule.platform,
              confidence: 0.9, // 高置信度
              extractedId
            }

            if (pattern) {
              result.matchedPattern = pattern
            }

            return result
          }
        } catch (error) {
          console.warn(`规则匹配失败: ${pattern}`, error)
        }
      }
    }

    // 没有匹配到任何规则，返回通用类型
    return {
      platform: 'generic',
      confidence: 0.1 // 低置信度
    }
  }

  /**
   * 获取所有规则
   */
  getRules(): PlatformRule[] {
    return [...this.rules]
  }

  /**
   * 添加新规则
   */
  addRule(rule: PlatformRule): void {
    this.rules.push(rule)
    this.rules.sort((a, b) => b.priority - a.priority)
  }

  /**
   * 更新规则
   */
  updateRule(platform: PlatformType, updates: Partial<Omit<PlatformRule, 'platform'>>): boolean {
    const index = this.rules.findIndex(r => r.platform === platform)
    if (index !== -1) {
      this.rules[index] = { ...this.rules[index], ...updates } as PlatformRule
      return true
    }
    return false
  }

  /**
   * 启用/禁用规则
   */
  setRuleEnabled(platform: PlatformType, enabled: boolean): boolean {
    return this.updateRule(platform, { enabled })
  }

  /**
   * 从配置文件加载规则
   */
  async loadRulesFromFile(path?: string): Promise<void> {
    if (!this.config.enableDynamicLoading) {
      return
    }

    const filePath = path || this.config.rulesPath
    try {
      // 这里可以添加从文件系统或网络加载规则的逻辑
      // 目前使用内置规则
      console.log(`从 ${filePath} 加载规则`)
    } catch (error) {
      console.error('加载规则失败:', error)
    }
  }

  /**
   * 从URL加载规则
   */
  async loadRulesFromUrl(url: string): Promise<void> {
    if (!this.config.enableDynamicLoading) {
      return
    }

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const rules = await response.json()
      if (Array.isArray(rules)) {
        this.rules = rules
        this.rules.sort((a, b) => b.priority - a.priority)
      }
    } catch (error) {
      console.error('从URL加载规则失败:', error)
    }
  }

  /**
   * 导出规则为JSON
   */
  exportRules(): string {
    return JSON.stringify(this.rules, null, 2)
  }

  // ========== 平台特定ID提取方法 ==========

  private extractYouTubeId(url: string): string | undefined {
    const patterns = [
      /youtube\.com\/watch\?v=([\w-]{11})/,
      /youtu\.be\/([\w-]{11})/,
      /youtube\.com\/shorts\/([\w-]+)/,
      /youtube\.com\/playlist\?list=([\w-]+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return undefined
  }

  private extractBilibiliId(url: string): string | undefined {
    const patterns = [
      /bilibili\.com\/video\/([A-Za-z0-9]+)/,
      /bilibili\.com\/bangumi\/play\/([a-z0-9]+)/,
      /b23\.tv\/([A-Za-z0-9]+)/,
      /bilibili\.com\/read\/([a-z0-9]+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return undefined
  }

  private extractTwitterId(url: string): string | undefined {
    const patterns = [
      /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
      /(?:twitter\.com|x\.com)\/(\w+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return undefined
  }

  private extractGitHubId(url: string): string | undefined {
    // GitHub URL通常包含用户名和仓库名，可以组合作为ID
    const match = url.match(/github\.com\/([\w.-]+)\/([\w.-]+)/)
    if (match && match[1] && match[2]) {
      return `${match[1]}/${match[2]}`
    }

    return undefined
  }
}