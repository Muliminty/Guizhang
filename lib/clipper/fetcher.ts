/**
 * 网页抓取服务
 * 封装网络请求，提供超时控制、错误处理和重试机制
 */

/**
 * 抓取配置选项
 */
export interface FetchOptions {
  /** 超时时间（毫秒） */
  timeout?: number
  /** 最大重试次数 */
  maxRetries?: number
  /** 重试延迟（毫秒） */
  retryDelay?: number
  /** 用户代理 */
  userAgent?: string
  /** 请求头 */
  headers?: Record<string, string>
  /** 是否跟随重定向 */
  followRedirects?: boolean
  /** 最大重定向次数 */
  maxRedirects?: number
  /** 代理服务器URL */
  proxyUrl?: string
  /** 是否启用gzip压缩 */
  enableGzip?: boolean
  /** 最大内容大小（字节） */
  maxContentSize?: number
  /** 是否验证SSL证书 */
  rejectUnauthorized?: boolean
}

/**
 * 抓取结果
 */
export interface FetchResult {
  /** 网页URL */
  url: string
  /** 最终URL（可能经过重定向） */
  finalUrl: string
  /** 响应状态码 */
  statusCode: number
  /** 响应头 */
  headers: Record<string, string>
  /** 网页内容 */
  content: string
  /** 内容类型 */
  contentType: string
  /** 字符编码 */
  charset?: string
  /** 抓取耗时（毫秒） */
  fetchTime: number
  /** 是否从缓存获取 */
  fromCache?: boolean
  /** 错误信息（如果有） */
  error?: string
}

/**
 * 抓取错误类型
 */
export class FetchError extends Error {
  constructor(
    message: string,
    public url: string,
    public statusCode?: number,
    public responseText?: string
  ) {
    super(message)
    this.name = 'FetchError'
  }
}

/**
 * 默认配置
 */
const DEFAULT_OPTIONS: Required<FetchOptions> = {
  timeout: 10000, // 10秒
  maxRetries: 2,
  retryDelay: 1000, // 1秒
  userAgent: 'Mozilla/5.0 (compatible; GuizhangClipper/1.0; +https://github.com/guizhang)',
  headers: {},
  followRedirects: true,
  maxRedirects: 5,
  proxyUrl: '',
  enableGzip: true,
  maxContentSize: 10 * 1024 * 1024, // 10MB
  rejectUnauthorized: true
}

/**
 * 网页抓取器
 */
export class WebFetcher {
  private options: Required<FetchOptions>
  private cache = new Map<string, { result: FetchResult; timestamp: number }>()
  private cacheTTL = 5 * 60 * 1000 // 5分钟缓存

  constructor(options: FetchOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * 抓取网页内容
   */
  async fetch(url: string, options: FetchOptions = {}): Promise<FetchResult> {
    const mergedOptions = { ...this.options, ...options }
    const startTime = Date.now()
    let lastError: Error | undefined

    // 检查缓存
    const cached = this.getFromCache(url)
    if (cached) {
      return { ...cached, fromCache: true }
    }

    for (let retry = 0; retry <= mergedOptions.maxRetries; retry++) {
      try {
        if (retry > 0) {
          console.log(`第${retry}次重试抓取: ${url}`)
          await this.delay(mergedOptions.retryDelay * retry)
        }

        const result = await this.fetchWithTimeout(url, mergedOptions)
        const fetchTime = Date.now() - startTime

        // 缓存结果
        this.cache.set(url, { result: { ...result, fetchTime }, timestamp: Date.now() })

        return { ...result, fetchTime }

      } catch (error) {
        lastError = error as Error
        console.warn(`抓取失败 (尝试 ${retry + 1}/${mergedOptions.maxRetries + 1}):`, error)

        // 如果是最后一次尝试，抛出错误
        if (retry === mergedOptions.maxRetries) {
          throw new FetchError(
            `抓取失败: ${lastError.message}`,
            url,
            undefined,
            lastError.message
          )
        }
      }
    }

    // 理论上不会执行到这里
    throw lastError || new FetchError('未知抓取错误', url)
  }

  /**
   * 带超时的抓取
   */
  private async fetchWithTimeout(url: string, options: Required<FetchOptions>): Promise<FetchResult> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), options.timeout)

    try {
      const headers = {
        'User-Agent': options.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        ...options.headers
      }

      const response = await fetch(url, {
        headers,
        signal: controller.signal,
        redirect: options.followRedirects ? 'follow' : 'manual'
      })

      clearTimeout(timeoutId)

      // 检查响应状态
      if (!response.ok) {
        throw new FetchError(
          `HTTP ${response.status}: ${response.statusText}`,
          url,
          response.status,
          await response.text().catch(() => '')
        )
      }

      // 获取最终URL（可能经过重定向）
      const finalUrl = response.url

      // 检查内容类型
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
        throw new FetchError(
          `不支持的内容类型: ${contentType}`,
          url,
          response.status,
          ''
        )
      }

      // 检查内容大小
      const contentLength = response.headers.get('content-length')
      if (contentLength) {
        const size = parseInt(contentLength, 10)
        if (!isNaN(size) && size > options.maxContentSize) {
          throw new FetchError(
            `内容太大: ${size}字节，超过限制${options.maxContentSize}字节`,
            url,
            response.status,
            ''
          )
        }
      }

      // 获取响应文本
      const content = await response.text()

      // 检查实际内容大小
      if (content.length > options.maxContentSize) {
        throw new FetchError(
          `内容太大: ${content.length}字节，超过限制${options.maxContentSize}字节`,
          url,
          response.status,
          content.substring(0, 1000) // 只保留部分内容用于调试
        )
      }

      // 提取响应头
      const headersObj: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        headersObj[key] = value
      })

      // 检测字符编码
      const charset = this.detectCharset(contentType, content)

      return {
        url,
        finalUrl,
        statusCode: response.status,
        headers: headersObj,
        content,
        contentType,
        charset
      } as FetchResult

    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof FetchError) {
        throw error
      }
      throw new FetchError(
        error instanceof Error ? error.message : '网络请求失败',
        url,
        undefined,
        ''
      )
    }
  }

  /**
   * 检测字符编码
   */
  private detectCharset(contentType: string, content: string): string | undefined {
    // 从Content-Type头获取
    const charsetMatch = contentType.match(/charset=([\w-]+)/i)
    if (charsetMatch && charsetMatch[1]) {
      return charsetMatch[1].toLowerCase()
    }

    // 从HTML meta标签获取
    const metaCharsetMatch = content.match(/<meta[^>]+charset=["']?([\w-]+)["']?/i)
    if (metaCharsetMatch && metaCharsetMatch[1]) {
      return metaCharsetMatch[1].toLowerCase()
    }

    return undefined
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 从缓存获取
   */
  private getFromCache(url: string): FetchResult | null {
    const cached = this.cache.get(url)
    if (!cached) {
      return null
    }

    // 检查缓存是否过期
    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(url)
      return null
    }

    return cached.result
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * 设置缓存TTL
   */
  setCacheTTL(ttl: number): void {
    this.cacheTTL = ttl
  }
}

/**
 * 默认抓取器实例
 */
export const defaultFetcher = new WebFetcher()

/**
 * 便捷函数：抓取网页
 */
export async function fetchWebPage(url: string, options: FetchOptions = {}): Promise<FetchResult> {
  return defaultFetcher.fetch(url, options)
}