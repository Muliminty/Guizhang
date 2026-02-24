/**
 * 文章存储服务
 * 提供文章的CRUD操作和查询功能
 */

import { EnhancedArticle } from '@/types'
import { db } from './database'

/**
 * 文章存储服务类
 */
export class ArticleStorageService {
  /**
   * 创建文章
   */
  async create(article: EnhancedArticle): Promise<EnhancedArticle> {
    try {
      // 检查文章是否已存在
      const existing = await db.articles.get(article.id)
      if (existing) {
        throw new Error(`文章已存在: ${article.id}`)
      }

      // 设置创建和更新时间
      const now = new Date().toISOString()
      const articleToSave = {
        ...article,
        createdAt: article.createdAt || now,
        updatedAt: now
      }

      // 保存到数据库
      await db.articles.add(articleToSave)
      return articleToSave
    } catch (error) {
      console.error('创建文章失败:', error)
      throw new Error(`创建文章失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 批量创建文章
   */
  async createBatch(articles: EnhancedArticle[]): Promise<EnhancedArticle[]> {
    try {
      const results: EnhancedArticle[] = []
      const now = new Date().toISOString()

      for (const article of articles) {
        const articleToSave = {
          ...article,
          createdAt: article.createdAt || now,
          updatedAt: now
        }

        await db.articles.add(articleToSave)
        results.push(articleToSave)
      }

      return results
    } catch (error) {
      console.error('批量创建文章失败:', error)
      throw new Error(`批量创建文章失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 获取文章
   */
  async get(id: string): Promise<EnhancedArticle | null> {
    try {
      const article = await db.articles.get(id)
      return article || null
    } catch (error) {
      console.error('获取文章失败:', error)
      throw new Error(`获取文章失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 获取所有文章
   */
  async getAll(options: {
    limit?: number
    offset?: number
    orderBy?: 'createdAt' | 'updatedAt' | 'title'
    order?: 'asc' | 'desc'
    includeArchived?: boolean
  } = {}): Promise<EnhancedArticle[]> {
    try {
      const {
        limit = 100,
        offset = 0,
        orderBy = 'createdAt',
        order = 'desc',
        includeArchived = false
      } = options

      let query = db.articles.toCollection()

      // 过滤归档文章
      if (!includeArchived) {
        query = query.filter(article => !article.isArchived)
      }

      // 排序
      if (orderBy === 'title') {
        query = order === 'asc' ? query.sortBy('title') : query.reverse().sortBy('title')
      } else {
        query = order === 'asc' ? query.and(article => article).sortBy(orderBy) : query.reverse().sortBy(orderBy)
      }

      // 分页
      const allArticles = await query
      return allArticles.slice(offset, offset + limit)
    } catch (error) {
      console.error('获取所有文章失败:', error)
      throw new Error(`获取所有文章失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 获取星标文章
   */
  async getStarred(options: {
    limit?: number
    offset?: number
  } = {}): Promise<EnhancedArticle[]> {
    try {
      const { limit = 100, offset = 0 } = options
      const articles = await db.articles
        .where('isStarred')
        .equals(true)
        .reverse()
        .sortBy('updatedAt')

      return articles.slice(offset, offset + limit)
    } catch (error) {
      console.error('获取星标文章失败:', error)
      throw new Error(`获取星标文章失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 按平台获取文章
   */
  async getByPlatform(platform: string, options: {
    limit?: number
    offset?: number
  } = {}): Promise<EnhancedArticle[]> {
    try {
      const { limit = 100, offset = 0 } = options
      const articles = await db.articles
        .where('platform')
        .equals(platform)
        .reverse()
        .sortBy('createdAt')

      return articles.slice(offset, offset + limit)
    } catch (error) {
      console.error('按平台获取文章失败:', error)
      throw new Error(`按平台获取文章失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 搜索文章
   */
  async search(query: string, options: {
    limit?: number
    offset?: number
    fields?: ('title' | 'content' | 'excerpt')[]
  } = {}): Promise<EnhancedArticle[]> {
    try {
      const { limit = 50, offset = 0, fields = ['title', 'content', 'excerpt'] } = options
      const searchTerm = query.toLowerCase().trim()

      if (!searchTerm) {
        return this.getAll({ limit, offset })
      }

      const allArticles = await db.articles.toArray()
      const results = allArticles.filter(article => {
        // 在所有指定字段中搜索
        return fields.some(field => {
          const value = article[field]
          return value && typeof value === 'string' && value.toLowerCase().includes(searchTerm)
        })
      })

      // 按相关性排序（简单实现：标题匹配优先）
      results.sort((a, b) => {
        const aTitleMatch = a.title?.toLowerCase().includes(searchTerm) ? 1 : 0
        const bTitleMatch = b.title?.toLowerCase().includes(searchTerm) ? 1 : 0
        return bTitleMatch - aTitleMatch || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

      return results.slice(offset, offset + limit)
    } catch (error) {
      console.error('搜索文章失败:', error)
      throw new Error(`搜索文章失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 更新文章
   */
  async update(id: string, updates: Partial<EnhancedArticle>): Promise<EnhancedArticle | null> {
    try {
      const article = await db.articles.get(id)
      if (!article) {
        return null
      }

      const updatedArticle = {
        ...article,
        ...updates,
        updatedAt: new Date().toISOString()
      }

      await db.articles.put(updatedArticle)
      return updatedArticle
    } catch (error) {
      console.error('更新文章失败:', error)
      throw new Error(`更新文章失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 标记为星标
   */
  async star(id: string): Promise<EnhancedArticle | null> {
    return this.update(id, { isStarred: true })
  }

  /**
   * 取消星标
   */
  async unstar(id: string): Promise<EnhancedArticle | null> {
    return this.update(id, { isStarred: false })
  }

  /**
   * 归档文章
   */
  async archive(id: string): Promise<EnhancedArticle | null> {
    return this.update(id, { isArchived: true })
  }

  /**
   * 取消归档
   */
  async unarchive(id: string): Promise<EnhancedArticle | null> {
    return this.update(id, { isArchived: false })
  }

  /**
   * 删除文章
   */
  async delete(id: string): Promise<boolean> {
    try {
      const deleted = await db.articles.delete(id)
      return deleted > 0
    } catch (error) {
      console.error('删除文章失败:', error)
      throw new Error(`删除文章失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 批量删除文章
   */
  async deleteBatch(ids: string[]): Promise<number> {
    try {
      let deletedCount = 0
      for (const id of ids) {
        const deleted = await db.articles.delete(id)
        if (deleted > 0) {
          deletedCount++
        }
      }
      return deletedCount
    } catch (error) {
      console.error('批量删除文章失败:', error)
      throw new Error(`批量删除文章失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 获取文章统计
   */
  async getStats() {
    try {
      const [
        total,
        starred,
        archived,
        byPlatform
      ] = await Promise.all([
        db.articles.count(),
        db.articles.where('isStarred').equals(true).count(),
        db.articles.where('isArchived').equals(true).count(),
        db.articles.toArray().then(articles => {
          const platformMap = new Map<string, number>()
          articles.forEach(article => {
            const platform = article.platform || 'unknown'
            platformMap.set(platform, (platformMap.get(platform) || 0) + 1)
          })
          return Object.fromEntries(platformMap)
        })
      ])

      return {
        total,
        starred,
        archived,
        byPlatform,
        unarchived: total - archived
      }
    } catch (error) {
      console.error('获取文章统计失败:', error)
      throw new Error(`获取文章统计失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 清空所有文章（开发/测试用）
   */
  async clearAll(): Promise<void> {
    try {
      await db.articles.clear()
    } catch (error) {
      console.error('清空文章失败:', error)
      throw new Error(`清空文章失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
}

/**
 * 默认文章存储服务实例
 */
export const articleStorage = new ArticleStorageService()

/**
 * 便捷函数：保存剪藏的文章
 */
export async function saveClippedArticle(clipperResult: any, userMetadata?: {
  title?: string
  tags?: string[]
  notes?: string
}): Promise<EnhancedArticle> {
  try {
    const article = clipperResult.article as EnhancedArticle

    // 合并用户元数据
    if (userMetadata) {
      if (userMetadata.title) {
        article.title = userMetadata.title
      }
      if (userMetadata.tags) {
        article.tags = userMetadata.tags
      }
      if (userMetadata.notes) {
        article.notes = userMetadata.notes
      }
    }

    // 保存到数据库
    return await articleStorage.create(article)
  } catch (error) {
    console.error('保存剪藏文章失败:', error)
    throw new Error(`保存剪藏文章失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}