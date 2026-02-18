import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并多个类名，处理Tailwind CSS类名冲突
 * 使用clsx处理条件类名，twMerge处理Tailwind类名冲突
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化日期时间
 * @param date 日期对象或字符串
 * @param format 格式字符串，默认'yyyy-MM-dd HH:mm'
 */
export function formatDate(date: Date | string, format = 'yyyy-MM-dd HH:mm'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return 'Invalid Date'

  const pad = (n: number) => n.toString().padStart(2, '0')

  const replacements: Record<string, string> = {
    yyyy: d.getFullYear().toString(),
    yy: d.getFullYear().toString().slice(2),
    MM: pad(d.getMonth() + 1),
    dd: pad(d.getDate()),
    HH: pad(d.getHours()),
    hh: pad(d.getHours() % 12 || 12),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds()),
    SSS: d.getMilliseconds().toString().padStart(3, '0'),
    a: d.getHours() < 12 ? 'AM' : 'PM',
  }

  return format.replace(/yyyy|yy|MM|dd|HH|hh|mm|ss|SSS|a/g, (match) => replacements[match] || match)
}

/**
 * 截断文本并添加省略号
 * @param text 原始文本
 * @param length 最大长度
 * @param suffix 后缀，默认为'...'
 */
export function truncate(text: string, length: number, suffix = '...'): string {
  if (text.length <= length) return text
  return text.slice(0, length) + suffix
}

/**
 * 生成随机ID
 * @param length ID长度，默认为8
 */
export function generateId(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 深度拷贝对象（简单实现，不处理函数、循环引用等复杂情况）
 * @param obj 要拷贝的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as T
  if (obj instanceof Array) return obj.map((item) => deepClone(item)) as T
  if (typeof obj === 'object') {
    const cloned: Record<string, any> = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = deepClone((obj as Record<string, any>)[key])
      }
    }
    return cloned as T
  }
  return obj
}

/**
 * 防抖函数
 * @param fn 要执行的函数
 * @param delay 延迟时间（毫秒）
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

/**
 * 节流函数
 * @param fn 要执行的函数
 * @param limit 限制时间（毫秒）
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * 检查对象是否为空
 * @param obj 要检查的对象
 */
export function isEmpty(obj: any): boolean {
  // eslint-disable-next-line eqeqeq
  if (obj == null) return true
  if (typeof obj === 'string') return obj.trim().length === 0
  if (Array.isArray(obj)) return obj.length === 0
  if (typeof obj === 'object') return Object.keys(obj).length === 0
  return false
}

/**
 * 生成文件大小字符串
 * @param bytes 字节数
 * @param decimals 小数位数
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * 延迟执行
 * @param ms 延迟时间（毫秒）
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 从URL中提取域名
 * @param url URL字符串
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return ''
  }
}

/**
 * 生成HSL颜色
 * @param seed 种子值
 * @param saturation 饱和度，默认70%
 * @param lightness 亮度，默认50%
 */
export function generateHslColor(seed: string, saturation = 70, lightness = 50): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = hash % 360
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

/**
 * 检查当前环境
 */
export const isBrowser = typeof window !== 'undefined'
export const isServer = typeof window === 'undefined'
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isProduction = process.env.NODE_ENV === 'production'
export const isTest = process.env.NODE_ENV === 'test'
