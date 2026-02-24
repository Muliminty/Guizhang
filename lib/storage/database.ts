/**
 * 归藏 - 数据库配置
 * 使用Dexie.js进行IndexedDB封装
 */

import Dexie, { Table } from 'dexie'
import { EnhancedArticle, Tag, ArticleTag } from '@/types'

/**
 * 数据库Schema定义
 */
export interface DatabaseSchema {
  articles: EnhancedArticle
  tags: Tag
  articleTags: ArticleTag
}

/**
 * 归藏数据库类
 */
export class GuizhangDatabase extends Dexie {
  // 表定义
  articles!: Table<EnhancedArticle, string> // id作为主键
  tags!: Table<Tag, string> // id作为主键
  articleTags!: Table<ArticleTag, [string, string]> // [articleId, tagId]作为复合主键

  constructor() {
    super('guizhang-db')

    // 定义Schema和索引
    this.version(1).stores({
      // 文章表
      articles: 'id, url, domain, createdAt, updatedAt, isStarred, isArchived, platform, contentType, processingStrategy',
      // 标签表
      tags: 'id, name, createdAt, updatedAt',
      // 文章-标签关联表
      articleTags: '[articleId+tagId], articleId, tagId'
    })

    // 设置表配置
    this.configureTables()
  }

  /**
   * 配置表选项
   */
  private configureTables() {
    // 文章表配置
    this.articles.mapToClass(ArticleEntity)

    // 标签表配置
    this.tags.mapToClass(TagEntity)
  }

  /**
   * 清空数据库（开发/测试用）
   */
  async clearAll() {
    await Promise.all([
      this.articles.clear(),
      this.tags.clear(),
      this.articleTags.clear()
    ])
  }

  /**
   * 获取数据库统计信息
   */
  async getStats() {
    const [articleCount, tagCount, articleTagCount] = await Promise.all([
      this.articles.count(),
      this.tags.count(),
      this.articleTags.count()
    ])

    return {
      articleCount,
      tagCount,
      articleTagCount,
      totalItems: articleCount + tagCount + articleTagCount
    }
  }
}

/**
 * 文章实体类
 * 提供额外的业务逻辑方法
 */
class ArticleEntity implements EnhancedArticle {
  id: string
  title: string
  content: string
  url: string
  domain: string
  author?: string
  publishedAt?: string
  readingTime?: number
  wordCount?: number
  excerpt?: string
  coverImage?: string
  createdAt: string
  updatedAt: string
  isStarred: boolean
  isArchived: boolean
  platform?: string
  contentType?: string
  platformMetadata?: any
  processingStrategy?: string
  qualityScore?: number
  tags?: string[]
  notes?: string
  language?: string

  constructor(data: EnhancedArticle) {
    this.id = data.id
    this.title = data.title
    this.content = data.content
    this.url = data.url
    this.domain = data.domain
    this.author = data.author
    this.publishedAt = data.publishedAt
    this.readingTime = data.readingTime
    this.wordCount = data.wordCount
    this.excerpt = data.excerpt
    this.coverImage = data.coverImage
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.isStarred = data.isStarred
    this.isArchived = data.isArchived
    this.platform = data.platform
    this.contentType = data.contentType
    this.platformMetadata = data.platformMetadata
    this.processingStrategy = data.processingStrategy
    this.qualityScore = data.qualityScore
    this.tags = data.tags
    this.notes = data.notes
    this.language = data.language
  }

  /**
   * 更新文章
   */
  update(data: Partial<EnhancedArticle>) {
    const updated = { ...this, ...data, updatedAt: new Date().toISOString() }
    return new ArticleEntity(updated)
  }

  /**
   * 标记为星标
   */
  star() {
    return this.update({ isStarred: true })
  }

  /**
   * 取消星标
   */
  unstar() {
    return this.update({ isStarred: false })
  }

  /**
   * 归档
   */
  archive() {
    return this.update({ isArchived: true })
  }

  /**
   * 取消归档
   */
  unarchive() {
    return this.update({ isArchived: false })
  }

  /**
   * 获取阅读时间（分钟）
   */
  getReadingTime(): number {
    return this.readingTime || Math.ceil((this.wordCount || 0) / 200)
  }

  /**
   * 获取质量评分
   */
  getQualityScore(): number {
    return this.qualityScore || 0.5
  }

  /**
   * 转换为JSON
   */
  toJSON(): EnhancedArticle {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      url: this.url,
      domain: this.domain,
      author: this.author,
      publishedAt: this.publishedAt,
      readingTime: this.readingTime,
      wordCount: this.wordCount,
      excerpt: this.excerpt,
      coverImage: this.coverImage,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isStarred: this.isStarred,
      isArchived: this.isArchived,
      platform: this.platform,
      contentType: this.contentType,
      platformMetadata: this.platformMetadata,
      processingStrategy: this.processingStrategy,
      qualityScore: this.qualityScore,
      tags: this.tags,
      notes: this.notes,
      language: this.language
    }
  }
}

/**
 * 标签实体类
 */
class TagEntity implements Tag {
  id: string
  name: string
  color?: string
  description?: string
  articleCount: number
  createdAt: string
  updatedAt: string

  constructor(data: Tag) {
    this.id = data.id
    this.name = data.name
    this.color = data.color
    this.description = data.description
    this.articleCount = data.articleCount
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  /**
   * 更新标签
   */
  update(data: Partial<Tag>) {
    const updated = { ...this, ...data, updatedAt: new Date().toISOString() }
    return new TagEntity(updated)
  }

  /**
   * 增加文章计数
   */
  incrementArticleCount() {
    return this.update({ articleCount: this.articleCount + 1 })
  }

  /**
   * 减少文章计数
   */
  decrementArticleCount() {
    return this.update({ articleCount: Math.max(0, this.articleCount - 1) })
  }

  /**
   * 转换为JSON
   */
  toJSON(): Tag {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      description: this.description,
      articleCount: this.articleCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}

/**
 * 创建数据库实例
 */
export const db = new GuizhangDatabase()

/**
 * 初始化数据库
 */
export async function initDatabase() {
  try {
    // 打开数据库连接
    await db.open()
    console.log('数据库初始化成功')
    return db
  } catch (error) {
    console.error('数据库初始化失败:', error)
    throw error
  }
}

/**
 * 检查数据库是否可用
 */
export function isDatabaseAvailable(): boolean {
  try {
    return !!db && db.isOpen()
  } catch {
    return false
  }
}

// 导出数据库实例
export default db