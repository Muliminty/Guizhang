/**
 * 处理策略决策器
 * 根据内容类型和用户偏好决定处理方式
 */

import { ContentType, ProcessingStrategy, PlatformPreferences } from '../../types'

/**
 * 策略决策器配置
 */
export interface StrategyDeciderConfig {
  defaultStrategies: Partial<Record<ContentType, ProcessingStrategy>>
  userPreferences?: PlatformPreferences
  enableContextAware?: boolean
  enableLearning?: boolean
}

/**
 * 上下文信息
 */
export interface DecisionContext {
  url?: string
  platform?: string
  metadata?: Record<string, any>
  userHistory?: {
    similarContentDecisions: Array<{
      contentType: ContentType
      strategy: ProcessingStrategy
      timestamp: number
      satisfaction?: number // 0-1 用户满意度
    }>
  }
  currentQueueSize?: number
  availableStorage?: number
}

/**
 * 策略决策结果
 */
export interface StrategyDecision {
  strategy: ProcessingStrategy
  confidence: number
  reasoning?: string[]
  alternatives?: Array<{
    strategy: ProcessingStrategy
    confidence: number
    reason: string
  }>
}

/**
 * 处理策略决策器
 */
export class StrategyDecider {
  private config: Required<StrategyDeciderConfig>
  private decisionHistory: Array<{
    contentType: ContentType
    strategy: ProcessingStrategy
    context: DecisionContext
    timestamp: number
    userFeedback?: number
  }> = []

  constructor(config: StrategyDeciderConfig = { defaultStrategies: {} }) {
    const defaultConfig = {
      defaultStrategies: this.getDefaultStrategies(),
      userPreferences: {
        defaultStrategies: {},
        enabledPlatforms: [],
        autoDetection: true,
        cacheDuration: 300000,
        fallbackToGeneric: true
      },
      enableContextAware: true,
      enableLearning: false
    }

    this.config = {
      ...defaultConfig,
      ...config,
      defaultStrategies: {
        ...defaultConfig.defaultStrategies,
        ...config.defaultStrategies
      }
    }
  }

  /**
   * 决定处理策略
   * @param contentType 内容类型
   * @param context 决策上下文
   * @returns 策略决策结果
   */
  decide(
    contentType: ContentType,
    context: DecisionContext = {}
  ): ProcessingStrategy {
    const decision = this.decideWithDetails(contentType, context)
    return decision.strategy
  }

  /**
   * 决定处理策略（带详细信息）
   * @param contentType 内容类型
   * @param context 决策上下文
   * @returns 完整的策略决策结果
   */
  decideWithDetails(
    contentType: ContentType,
    context: DecisionContext = {}
  ): StrategyDecision {
    const reasoning: string[] = []
    let alternatives: Array<{
      strategy: ProcessingStrategy
      confidence: number
      reason: string
    }> = []

    // 1. 获取默认策略
    const defaultStrategy = this.config.defaultStrategies[contentType] || 'clip'
    let finalStrategy = defaultStrategy
    let confidence = 0.8 // 默认置信度

    reasoning.push(`内容类型 "${contentType}" 的默认策略是 "${defaultStrategy}"`)

    // 2. 应用上下文感知规则
    if (this.config.enableContextAware) {
      const contextResult = this.applyContextRules(contentType, context)
      if (contextResult.strategy !== defaultStrategy) {
        finalStrategy = contextResult.strategy
        confidence = contextResult.confidence
        reasoning.push(...(contextResult.reasoning || []))

        // 添加默认策略作为备选
        alternatives.push({
          strategy: defaultStrategy,
          confidence: 0.7,
          reason: '默认策略'
        })
      }
    }

    // 3. 应用用户历史学习
    if (this.config.enableLearning && context.userHistory) {
      const learningResult = this.applyLearning(contentType, context)
      if (learningResult.strategy !== finalStrategy) {
        alternatives.push({
          strategy: learningResult.strategy,
          confidence: learningResult.confidence,
          reason: '基于用户历史学习'
        })
      }
    }

    // 4. 记录决策历史
    this.recordDecision(contentType, finalStrategy, context)

    const result: StrategyDecision = {
      strategy: finalStrategy,
      confidence,
      reasoning
    }

    if (alternatives.length > 0) {
      result.alternatives = alternatives
    }

    return result
  }

  /**
   * 应用上下文规则
   */
  private applyContextRules(
    contentType: ContentType,
    context: DecisionContext
  ): StrategyDecision {
    const rules = this.getContextRules()
    const reasoning: string[] = []
    let bestMatch: StrategyDecision | null = null

    for (const rule of rules) {
      if (rule.condition(contentType, context)) {
        const matchQuality = rule.matchQuality(contentType, context)

        if (!bestMatch || matchQuality > bestMatch.confidence) {
          bestMatch = {
            strategy: rule.strategy,
            confidence: matchQuality,
            reasoning: [rule.reason]
          }
        }
      }
    }

    if (bestMatch) {
      reasoning.push(`上下文规则匹配: ${bestMatch.reasoning?.[0]}`)
      return {
        strategy: bestMatch.strategy,
        confidence: bestMatch.confidence,
        reasoning
      }
    }

    // 没有匹配的上下文规则
    const defaultStrategy = this.config.defaultStrategies[contentType] || 'clip'
    return {
      strategy: defaultStrategy,
      confidence: 0.7,
      reasoning: ['没有匹配的上下文规则，使用默认策略']
    }
  }

  /**
   * 应用学习规则
   */
  private applyLearning(
    contentType: ContentType,
    context: DecisionContext
  ): StrategyDecision {
    if (!context.userHistory?.similarContentDecisions?.length) {
      const defaultStrategy = this.config.defaultStrategies[contentType] || 'clip'
      return {
        strategy: defaultStrategy,
        confidence: 0.5,
        reasoning: ['没有用户历史数据']
      }
    }

    // 分析相似内容的决策历史
    const similarDecisions = context.userHistory.similarContentDecisions
      .filter(d => d.contentType === contentType)
      .sort((a, b) => b.timestamp - a.timestamp) // 最近的优先

    if (similarDecisions.length === 0) {
      const defaultStrategy = this.config.defaultStrategies[contentType] || 'clip'
      return {
        strategy: defaultStrategy,
        confidence: 0.5,
        reasoning: ['没有相同内容类型的历史决策']
      }
    }

    // 计算策略频率
    const strategyCounts = new Map<ProcessingStrategy, number>()
    let totalWeight = 0

    for (const decision of similarDecisions) {
      const age = Date.now() - decision.timestamp
      const weight = Math.exp(-age / (30 * 24 * 60 * 60 * 1000)) // 30天衰减

      const count = (strategyCounts.get(decision.strategy) || 0) + weight
      strategyCounts.set(decision.strategy, count)
      totalWeight += weight
    }

    // 找到最常用的策略
    let bestStrategy: ProcessingStrategy = 'clip'
    let bestScore = 0

    for (const [strategy, count] of strategyCounts.entries()) {
      const score = count / totalWeight
      if (score > bestScore) {
        bestScore = score
        bestStrategy = strategy
      }
    }

    // 考虑用户满意度
    const satisfactionScores = similarDecisions
      .filter(d => d.satisfaction !== undefined)
      .map(d => d.satisfaction!)

    let satisfactionBonus = 0
    if (satisfactionScores.length > 0) {
      const avgSatisfaction = satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length
      satisfactionBonus = avgSatisfaction * 0.2 // 满意度最多增加20%置信度
    }

    return {
      strategy: bestStrategy,
      confidence: Math.min(0.9, bestScore + satisfactionBonus),
      reasoning: [`基于 ${similarDecisions.length} 个历史决策学习`]
    }
  }

  /**
   * 获取上下文规则
   */
  private getContextRules(): Array<{
    condition: (contentType: ContentType, context: DecisionContext) => boolean
    strategy: ProcessingStrategy
    matchQuality: (contentType: ContentType, context: DecisionContext) => number
    reason: string
  }> {
    return [
      // 视频相关规则
      {
        condition: (type, ctx) =>
          type === 'video' &&
          ctx.metadata?.duration &&
          ctx.metadata.duration < 300, // 5分钟以内的视频
        strategy: 'clip',
        matchQuality: (type, ctx) => {
          const duration = ctx.metadata?.duration || 0
          return duration < 60 ? 0.9 : 0.7 // 1分钟以内置信度更高
        },
        reason: '短视频适合直接剪藏'
      },
      {
        condition: (type, ctx) =>
          type === 'video' &&
          ctx.currentQueueSize !== undefined &&
          ctx.currentQueueSize < 5, // 队列较短时
        strategy: 'watch_later',
        matchQuality: () => 0.8,
        reason: '队列较短，适合添加到稍后观看'
      },

      // 文章相关规则
      {
        condition: (type, ctx) =>
          type === 'article' &&
          ctx.metadata?.wordCount &&
          ctx.metadata.wordCount > 5000, // 长文章
        strategy: 'watch_later',
        matchQuality: (type, ctx) => {
          const wordCount = ctx.metadata?.wordCount || 0
          return wordCount > 10000 ? 0.9 : 0.7
        },
        reason: '长文章适合稍后阅读'
      },
      {
        condition: (type, ctx) =>
          type === 'article' &&
          ctx.availableStorage !== undefined &&
          ctx.availableStorage < 50 * 1024 * 1024, // 存储空间不足50MB
        strategy: 'bookmark',
        matchQuality: () => 0.9,
        reason: '存储空间不足，使用书签保存'
      },

      // 代码相关规则
      {
        condition: (type, ctx) =>
          (type === 'code_repository' || type === 'documentation') &&
          ctx.metadata?.language === 'zh', // 中文文档
        strategy: 'clip',
        matchQuality: () => 0.8,
        reason: '中文文档适合剪藏'
      },

      // 讨论相关规则
      {
        condition: (type, ctx) =>
          type === 'discussion' &&
          ctx.metadata?.commentCount &&
          ctx.metadata.commentCount > 100, // 热门讨论
        strategy: 'bookmark',
        matchQuality: (type, ctx) => {
          const commentCount = ctx.metadata?.commentCount || 0
          return commentCount > 500 ? 0.9 : 0.7
        },
        reason: '热门讨论适合书签保存'
      },

      // 通用规则
      {
        condition: (type, ctx) =>
          ctx.url?.includes('tutorial') ||
          ctx.url?.includes('guide') ||
          ctx.metadata?.title?.toLowerCase().includes('tutorial'),
        strategy: 'clip',
        matchQuality: () => 0.8,
        reason: '教程类内容适合剪藏'
      },
      {
        condition: (type, ctx) =>
          ctx.url?.includes('news') ||
          ctx.metadata?.title?.toLowerCase().includes('news'),
        strategy: 'bookmark',
        matchQuality: () => 0.7,
        reason: '新闻类内容适合书签保存'
      }
    ]
  }

  /**
   * 记录决策历史
   */
  private recordDecision(
    contentType: ContentType,
    strategy: ProcessingStrategy,
    context: DecisionContext
  ): void {
    if (!this.config.enableLearning) {
      return
    }

    this.decisionHistory.push({
      contentType,
      strategy,
      context,
      timestamp: Date.now()
    })

    // 限制历史记录大小
    if (this.decisionHistory.length > 1000) {
      this.decisionHistory = this.decisionHistory.slice(-500)
    }
  }

  /**
   * 获取默认策略映射
   */
  private getDefaultStrategies(): Record<ContentType, ProcessingStrategy> {
    return {
      article: 'clip',
      video: 'watch_later',
      tweet: 'bookmark',
      code_repository: 'bookmark',
      documentation: 'clip',
      discussion: 'bookmark',
      image_gallery: 'bookmark',
      generic: 'clip'
    }
  }

  /**
   * 更新用户偏好
   */
  updatePreferences(preferences: Partial<PlatformPreferences>): void {
    if (preferences.defaultStrategies) {
      this.config.defaultStrategies = {
        ...this.config.defaultStrategies,
        ...preferences.defaultStrategies
      }
    }
  }

  /**
   * 获取决策历史
   */
  getDecisionHistory() {
    return [...this.decisionHistory]
  }

  /**
   * 清除决策历史
   */
  clearDecisionHistory(): void {
    this.decisionHistory = []
  }

  /**
   * 提供用户反馈
   */
  provideFeedback(
    contentType: ContentType,
    strategy: ProcessingStrategy,
    satisfaction: number // 0-1
  ): void {
    if (!this.config.enableLearning) {
      return
    }

    // 找到最近的匹配决策
    const recentDecision = this.decisionHistory
      .filter(d => d.contentType === contentType && d.strategy === strategy)
      .sort((a, b) => b.timestamp - a.timestamp)[0]

    if (recentDecision) {
      recentDecision.userFeedback = satisfaction
    }
  }
}