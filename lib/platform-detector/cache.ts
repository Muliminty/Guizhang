/**
 * 平台检测缓存管理器
 * 提供内存缓存功能，减少重复检测开销
 */

import { PlatformDetectionResult } from '../../types'

/**
 * 缓存项接口
 */
interface CacheItem {
  result: PlatformDetectionResult
  timestamp: number
  expiresAt: number
  accessCount: number
}

/**
 * 缓存管理器配置
 */
export interface CacheManagerConfig {
  enabled: boolean
  duration: number // 缓存时长（毫秒）
  maxSize: number // 最大缓存项数
  cleanupInterval?: number // 清理间隔（毫秒）
}

/**
 * 缓存统计信息
 */
export interface CacheStats {
  size: number
  hits: number
  misses: number
  hitRate: number
  oldestItemAge: number // 毫秒
  newestItemAge: number // 毫秒
  memoryUsage?: number // 估计的内存使用量（字节）
}

/**
 * 平台检测缓存管理器
 */
export class CacheManager {
  private cache: Map<string, CacheItem> = new Map()
  private stats = {
    hits: 0,
    misses: 0,
    lastCleanup: Date.now()
  }
  private config: Required<CacheManagerConfig>
  private cleanupTimer: ReturnType<typeof setInterval> | null = null

  constructor(config: CacheManagerConfig) {
    this.config = {
      cleanupInterval: 5 * 60 * 1000, // 5分钟
      ...config
    }

    if (this.config.enabled) {
      this.startCleanupTimer()
    }
  }

  /**
   * 获取缓存项
   * @param key 缓存键（通常是URL）
   * @returns 缓存的结果，如果不存在或已过期则返回null
   */
  get(key: string): PlatformDetectionResult | null {
    if (!this.config.enabled) {
      this.stats.misses++
      return null
    }

    const item = this.cache.get(key)

    if (!item) {
      this.stats.misses++
      return null
    }

    // 检查是否过期
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    // 更新访问统计
    item.accessCount++
    this.stats.hits++

    return { ...item.result }
  }

  /**
   * 设置缓存项
   * @param key 缓存键
   * @param result 要缓存的结果
   * @param duration 自定义缓存时长（毫秒）
   */
  set(key: string, result: PlatformDetectionResult, duration?: number): void {
    if (!this.config.enabled) {
      return
    }

    // 检查缓存大小，如果超过限制则清理最旧的项
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldestItems(10) // 清理10个最旧的项
    }

    const now = Date.now()
    const cacheDuration = duration || this.config.duration

    const item: CacheItem = {
      result: { ...result },
      timestamp: now,
      expiresAt: now + cacheDuration,
      accessCount: 0
    }

    this.cache.set(key, item)
  }

  /**
   * 删除缓存项
   * @param key 缓存键
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.cache.clear()
    this.stats.hits = 0
    this.stats.misses = 0
    this.stats.lastCleanup = Date.now()
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    const now = Date.now()
    let oldestAge = 0
    let newestAge = 0

    if (this.cache.size > 0) {
      const timestamps = Array.from(this.cache.values()).map(item => item.timestamp)
      const minTimestamp = Math.min(...timestamps)
      const maxTimestamp = Math.max(...timestamps)
      oldestAge = now - minTimestamp
      newestAge = now - maxTimestamp
    }

    const totalAccesses = this.stats.hits + this.stats.misses
    const hitRate = totalAccesses > 0 ? this.stats.hits / totalAccesses : 0

    // 估算内存使用量（粗略估计）
    let memoryUsage = 0
    for (const [key, item] of this.cache) {
      // 估算字符串和对象的大小
      memoryUsage += key.length * 2 // UTF-16
      memoryUsage += JSON.stringify(item.result).length * 2
      memoryUsage += 100 // 其他开销
    }

    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      oldestItemAge: oldestAge,
      newestItemAge: newestAge,
      memoryUsage
    }
  }

  /**
   * 获取所有缓存键
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * 检查缓存项是否存在且未过期
   */
  has(key: string): boolean {
    if (!this.config.enabled) {
      return false
    }

    const item = this.cache.get(key)
    if (!item) {
      return false
    }

    return Date.now() <= item.expiresAt
  }

  /**
   * 更新缓存项过期时间
   * @param key 缓存键
   * @param duration 新的缓存时长（毫秒）
   */
  refresh(key: string, duration?: number): boolean {
    const item = this.cache.get(key)
    if (!item) {
      return false
    }

    const newDuration = duration || this.config.duration
    item.expiresAt = Date.now() + newDuration
    return true
  }

  /**
   * 清理过期缓存项
   */
  cleanup(): number {
    const now = Date.now()
    let removedCount = 0

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key)
        removedCount++
      }
    }

    this.stats.lastCleanup = now
    return removedCount
  }

  /**
   * 清理最不常用的项
   * @param count 要清理的项数
   */
  evictLeastUsed(count: number): number {
    if (this.cache.size <= count) {
      const size = this.cache.size
      this.cache.clear()
      return size
    }

    // 按访问次数排序
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => (a[1].accessCount || 0) - (b[1].accessCount || 0))

    let removedCount = 0
    for (let i = 0; i < count && i < entries.length; i++) {
      const entry = entries[i]
      if (entry && entry[0]) {
        this.cache.delete(entry[0])
        removedCount++
      }
    }

    return removedCount
  }

  /**
   * 清理最旧的项
   * @param count 要清理的项数
   */
  evictOldestItems(count: number): number {
    if (this.cache.size <= count) {
      const size = this.cache.size
      this.cache.clear()
      return size
    }

    // 按时间戳排序
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)

    let removedCount = 0
    for (let i = 0; i < count && i < entries.length; i++) {
      const entry = entries[i]
      if (entry && entry[0]) {
        this.cache.delete(entry[0])
        removedCount++
      }
    }

    return removedCount
  }

  /**
   * 启动定时清理任务
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    this.cleanupTimer = setInterval(() => {
      const removed = this.cleanup()
      if (removed > 0) {
        console.log(`清理了 ${removed} 个过期缓存项`)
      }
    }, this.config.cleanupInterval)
  }

  /**
   * 停止定时清理任务
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  /**
   * 销毁缓存管理器
   */
  destroy(): void {
    this.stopCleanupTimer()
    this.clear()
  }
}

/**
 * 创建缓存管理器实例
 */
export function createCacheManager(config: CacheManagerConfig): CacheManager {
  return new CacheManager(config)
}