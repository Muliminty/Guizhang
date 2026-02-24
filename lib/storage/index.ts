/**
 * 归藏 - 存储层
 * 统一导出所有存储相关功能
 */

// 数据库配置
export * from './database'
export { db, initDatabase, isDatabaseAvailable } from './database'

// 文章存储服务
export * from './article-storage'
export { articleStorage, saveClippedArticle } from './article-storage'

// 标签存储服务
export * from './tag-storage'

// 存储适配器
export * from './storage-adapter'