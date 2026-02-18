/**
 * 归藏 - 类型定义
 * 所有全局类型定义都在此文件中导出
 */

/* 文章相关类型 */
export interface Article {
  id: string
  title: string
  content: string
  url: string
  domain: string
  author?: string
  publishedAt?: string
  readingTime?: number // 分钟
  wordCount?: number
  excerpt?: string
  coverImage?: string
  createdAt: string
  updatedAt: string
  isStarred: boolean
  isArchived: boolean
}

export interface ArticleCreateInput {
  title: string
  content: string
  url: string
  author?: string
  publishedAt?: string
  readingTime?: number
  wordCount?: number
  excerpt?: string
  coverImage?: string
}

export interface ArticleUpdateInput {
  title?: string
  content?: string
  author?: string
  isStarred?: boolean
  isArchived?: boolean
}

/* 标签相关类型 */
export interface Tag {
  id: string
  name: string
  color?: string
  description?: string
  articleCount: number
  createdAt: string
  updatedAt: string
}

export interface TagCreateInput {
  name: string
  color?: string
  description?: string
}

export interface TagUpdateInput {
  name?: string
  color?: string
  description?: string
}

/* 文章-标签关联 */
export interface ArticleTag {
  articleId: string
  tagId: string
}

/* 剪藏相关类型 */
export interface ClipperResult {
  success: boolean
  data?: Article
  error?: string
  warnings?: string[]
  metadata?: {
    title: string
    author?: string
    publishedAt?: string
    readingTime?: number
    wordCount?: number
    excerpt?: string
    coverImage?: string
  }
}

export interface ClipperOptions {
  url: string
  timeout?: number
  includeImages?: boolean
  fallbackToOriginal?: boolean
}

/* 搜索相关类型 */
export interface SearchOptions {
  query: string
  limit?: number
  offset?: number
  filters?: SearchFilters
}

export interface SearchFilters {
  tags?: string[]
  isStarred?: boolean
  isArchived?: boolean
  dateRange?: {
    start: string
    end: string
  }
}

export interface SearchResult {
  articles: Article[]
  total: number
  query: string
  took: number // 搜索耗时（毫秒）
}

/* 分页相关类型 */
export interface PaginationParams {
  page: number
  pageSize: number
  total: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationParams
}

/* 排序相关类型 */
export type SortField = 'createdAt' | 'updatedAt' | 'title' | 'readingTime' | 'wordCount'
export type SortOrder = 'asc' | 'desc'

export interface SortOptions {
  field: SortField
  order: SortOrder
}

/* UI相关类型 */
export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

/* 存储相关类型 */
export interface StorageStats {
  totalArticles: number
  totalTags: number
  totalSize: number
  lastBackup?: string
}

export interface BackupData {
  version: string
  exportedAt: string
  articles: Article[]
  tags: Tag[]
  articleTags: ArticleTag[]
}

/* API响应类型 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

/* 环境配置类型 */
export interface AppConfig {
  appName: string
  appVersion: string
  isDevelopment: boolean
  isProduction: boolean
  apiBaseUrl: string
  storageQuota: number
  features: {
    clipper: boolean
    search: boolean
    offline: boolean
    export: boolean
    import: boolean
    sync: boolean
  }
}

/* 用户设置类型 */
export interface UserSettings {
  theme: 'light' | 'dark' | 'auto'
  language: string
  readingMode: 'single' | 'double' | 'scroll'
  fontSize: number
  lineHeight: number
  autoSave: boolean
  backupInterval: number
  defaultTags: string[]
  clipperOptions: {
    timeout: number
    includeImages: boolean
    autoAddTags: boolean
  }
}

/* 通用工具类型 */
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type ValueOf<T> = T[keyof T]
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/* 事件类型 */
export interface AppEventMap {
  'article:created': Article
  'article:updated': Article
  'article:deleted': string // articleId
  'tag:created': Tag
  'tag:updated': Tag
  'tag:deleted': string // tagId
  'clipper:start': string // url
  'clipper:complete': ClipperResult
  'clipper:error': string // error message
  'search:perform': SearchOptions
  'search:complete': SearchResult
  'settings:changed': Partial<UserSettings>
  'backup:created': string // backupId
  'backup:restored': string // backupId
}

export type AppEvent = keyof AppEventMap
export type AppEventHandler<T extends AppEvent> = (data: AppEventMap[T]) => void
