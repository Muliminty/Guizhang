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

/* ========== 平台检测相关类型 ========== */

/**
 * 平台类型枚举
 * 支持主流内容平台和社交媒体
 */
export type PlatformType =
  | 'youtube'        // YouTube
  | 'bilibili'       // B站
  | 'twitter'        // Twitter/X
  | 'medium'         // Medium
  | 'zhihu'          // 知乎
  | 'github'         // GitHub
  | 'weibo'          // 微博
  | 'tiktok'         // 抖音/TikTok
  | 'reddit'         // Reddit
  | 'stackoverflow'  // Stack Overflow
  | 'devto'          // dev.to
  | 'hackernews'     // Hacker News
  | 'generic'        // 通用网站

/**
 * 内容类型枚举
 * 基于平台和内容特征判断
 */
export type ContentType =
  | 'article'          // 文章/博客
  | 'video'            // 视频
  | 'image_gallery'    // 图片集
  | 'tweet'            // 推文
  | 'code_repository'  // 代码仓库
  | 'documentation'    // 文档
  | 'discussion'       // 讨论/问答
  | 'generic'          // 通用内容

/**
 * 处理策略枚举
 * 根据内容类型决定处理方式
 */
export type ProcessingStrategy =
  | 'clip'          // 剪藏为文章
  | 'watch_later'   // 稍后观看
  | 'bookmark'      // 书签保存
  | 'ignore'        // 忽略不处理

/**
 * 平台元数据接口
 * 包含平台特定的内容信息
 */
export interface PlatformMetadata {
  platformId?: string      // 平台特定ID（如视频ID、文章ID）
  title?: string           // 内容标题
  description?: string     // 内容描述
  thumbnail?: string       // 缩略图URL
  duration?: number        // 视频时长（秒）
  author?: string          // 作者/发布者
  publishedAt?: string     // 发布时间
  viewCount?: number       // 观看/阅读数
  likeCount?: number       // 点赞数
  commentCount?: number    // 评论数
  tags?: string[]          // 标签/分类
  language?: string        // 内容语言
  isLive?: boolean         // 是否直播
  isPremium?: boolean      // 是否付费内容
  rawData?: Record<string, any> // 原始元数据
}

/**
 * 平台检测结果接口
 * 包含平台识别和内容分析结果
 */
export interface PlatformDetectionResult {
  platform: PlatformType           // 检测到的平台
  contentType: ContentType         // 内容类型
  confidence: number               // 置信度 0-1
  matchedPattern?: string          // 匹配的URL模式
  metadata?: PlatformMetadata      // 提取的元数据
  processingStrategy?: ProcessingStrategy // 推荐处理策略
  error?: string                   // 检测过程中的错误
  warnings?: string[]              // 警告信息
}

/**
 * 增强的文章接口
 * 扩展原有Article类型，添加平台信息
 */
export interface EnhancedArticle extends Article {
  platform?: PlatformType          // 来源平台
  contentType?: ContentType        // 内容类型
  platformMetadata?: PlatformMetadata // 平台元数据
  processingStrategy?: ProcessingStrategy // 处理策略
}

/**
 * 平台规则配置接口
 * 定义平台检测规则
 */
export interface PlatformRule {
  platform: PlatformType           // 平台标识
  patterns: string[]               // URL正则模式数组
  contentType: ContentType         // 默认内容类型
  metadataExtractor?: string       // 元数据提取器名称
  priority: number                 // 规则优先级（越高越优先）
  enabled: boolean                 // 是否启用
  description?: string             // 规则描述
}

/**
 * 用户平台偏好设置
 */
export interface PlatformPreferences {
  defaultStrategies: Partial<Record<ContentType, ProcessingStrategy>> // 各内容类型的默认处理策略
  enabledPlatforms: PlatformType[] // 启用的平台列表
  autoDetection: boolean           // 是否自动检测
  cacheDuration: number            // 缓存时长（毫秒）
  fallbackToGeneric: boolean       // 是否降级为通用类型
}

/**
 * 稍后观看队列项
 */
export interface WatchLaterItem {
  id: string                      // 唯一标识
  url: string                     // 原始URL
  title: string                   // 内容标题
  description?: string            // 内容描述
  thumbnail?: string              // 缩略图URL
  duration?: number               // 时长（秒）
  platform: PlatformType          // 来源平台
  platformId?: string             // 平台特定ID
  addedAt: string                 // 添加时间
  watchedAt?: string              // 观看时间
  progress?: number               // 观看进度 0-1
  isCompleted: boolean            // 是否已完成
  priority?: 'high' | 'normal' | 'low' // 优先级
  tags?: string[]                 // 标签
  notes?: string                  // 用户笔记
  metadata?: PlatformMetadata     // 完整元数据
}

/**
 * 观看队列状态
 */
export interface WatchLaterQueue {
  items: WatchLaterItem[]         // 队列项列表
  currentIndex?: number           // 当前播放项索引
  stats: {
    total: number                 // 总项数
    completed: number             // 已完成数
    totalDuration: number         // 总时长（秒）
    averageProgress: number       // 平均进度
  }
  settings: {
    autoPlay: boolean             // 自动播放下一项
    autoRemoveCompleted: boolean  // 自动移除已完成项
    defaultPriority: 'high' | 'normal' | 'low' // 默认优先级
    maxQueueSize: number          // 最大队列大小
    syncAcrossDevices: boolean    // 跨设备同步
  }
}

/**
 * 队列操作接口
 */
export interface QueueOperations {
  add(item: Omit<WatchLaterItem, 'id' | 'addedAt' | 'isCompleted'>): Promise<string>
  remove(id: string): Promise<void>
  updateProgress(id: string, progress: number): Promise<void>
  markCompleted(id: string): Promise<void>
  reorder(ids: string[]): Promise<void>
  clearCompleted(): Promise<void>
  getNext(): Promise<WatchLaterItem | null>
  getQueue(): Promise<WatchLaterQueue>
}

/**
 * 平台检测器接口
 */
export interface PlatformDetector {
  detect(url: string): Promise<PlatformDetectionResult>
  extractMetadata(url: string, platform: PlatformType): Promise<PlatformMetadata>
  classifyContent(platform: PlatformType, metadata: PlatformMetadata): ContentType
  decideStrategy(contentType: ContentType, preferences?: PlatformPreferences): ProcessingStrategy
}

/**
 * 平台检测事件
 */
export interface PlatformDetectionEventMap {
  'platform:detect:start': string // url
  'platform:detect:complete': PlatformDetectionResult
  'platform:detect:error': { url: string; error: string }
  'watch-later:item:added': WatchLaterItem
  'watch-later:item:removed': string // itemId
  'watch-later:item:updated': WatchLaterItem
  'watch-later:queue:changed': WatchLaterQueue
}

export type PlatformEvent = keyof PlatformDetectionEventMap
export type PlatformEventHandler<T extends PlatformEvent> = (data: PlatformDetectionEventMap[T]) => void

// 扩展原有事件映射
declare module './index' {
  interface AppEventMap extends PlatformDetectionEventMap {}
}
