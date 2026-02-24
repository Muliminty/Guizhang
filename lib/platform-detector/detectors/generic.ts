/**
 * 通用平台检测器
 * 处理未匹配到特定平台的情况，提供基础检测和元数据提取
 */

import { PlatformType, PlatformMetadata, ContentType } from '../../../types'

/**
 * 通用检测器配置
 */
export interface GenericDetectorConfig {
  enableHeuristicDetection?: boolean
  enableContentAnalysis?: boolean
  timeout?: number
  maxRedirects?: number
}

/**
 * 网页基本信息
 */
export interface WebpageInfo {
  url: string
  finalUrl?: string
  title?: string
  description?: string
  keywords?: string[]
  language?: string
  charset?: string
  contentType?: string
  contentLength?: number
  lastModified?: string
  isRedirected: boolean
  redirectCount: number
}

/**
 * 内容分析结果
 */
export interface ContentAnalysis {
  estimatedWordCount: number
  estimatedReadingTime: number // 分钟
  hasImages: boolean
  hasVideos: boolean
  hasForms: boolean
  isArticleLike: boolean
  isBlogLike: boolean
  isNewsLike: boolean
  isDocumentationLike: boolean
  primaryLanguage?: string
}

/**
 * 通用平台检测器
 */
export class GenericDetector {
  private config: Required<GenericDetectorConfig>

  constructor(config: GenericDetectorConfig = {}) {
    this.config = {
      enableHeuristicDetection: true,
      enableContentAnalysis: true,
      timeout: 10000,
      maxRedirects: 3,
      ...config
    }
  }

  /**
   * 检测URL
   * @param url 要检测的URL
   * @returns 检测结果
   */
  async detect(url: string): Promise<{
    isGeneric: boolean
    platform?: PlatformType
    contentType?: ContentType
    confidence: number
    webpageInfo?: WebpageInfo
  }> {
    try {
      // 获取网页基本信息
      const webpageInfo = await this.fetchWebpageInfo(url)

      // 分析内容类型
      let contentType: ContentType = 'generic'
      let confidence = 0.5

      if (this.config.enableHeuristicDetection) {
        const heuristicResult = this.analyzeByHeuristics(webpageInfo)
        contentType = heuristicResult.contentType
        confidence = heuristicResult.confidence
      }

      // 进一步内容分析
      if (this.config.enableContentAnalysis && webpageInfo.contentType?.includes('text/html')) {
        const contentAnalysis = await this.analyzeContent(url)
        if (contentAnalysis.isArticleLike) {
          contentType = 'article'
          confidence = Math.max(confidence, 0.7)
        } else if (contentAnalysis.isDocumentationLike) {
          contentType = 'documentation'
          confidence = Math.max(confidence, 0.6)
        }
      }

      // 尝试识别特定平台特征
      const platformFeatures = this.detectPlatformFeatures(webpageInfo)
      let platform: PlatformType = 'generic'

      if (platformFeatures.confidence > 0.7) {
        platform = platformFeatures.platform
        confidence = Math.max(confidence, platformFeatures.confidence)
      }

      return {
        isGeneric: platform === 'generic',
        platform,
        contentType,
        confidence,
        webpageInfo
      }

    } catch (error) {
      console.warn('通用检测失败:', error)

      return {
        isGeneric: true,
        platform: 'generic',
        contentType: 'generic',
        confidence: 0.1
      }
    }
  }

  /**
   * 提取通用元数据
   * @param url 目标URL
   * @returns 元数据
   */
  async extractMetadata(url: string): Promise<PlatformMetadata> {
    try {
      const webpageInfo = await this.fetchWebpageInfo(url)

      // 基础元数据
      const metadata: PlatformMetadata = {
        title: webpageInfo.title,
        description: webpageInfo.description,
        language: webpageInfo.language,
        rawData: {
          source: 'generic-detector',
          contentType: webpageInfo.contentType,
          contentLength: webpageInfo.contentLength,
          lastModified: webpageInfo.lastModified,
          isRedirected: webpageInfo.isRedirected,
          redirectCount: webpageInfo.redirectCount,
          extractedAt: new Date().toISOString()
        }
      }

      // 如果启用了内容分析，添加更多信息
      if (this.config.enableContentAnalysis && webpageInfo.contentType?.includes('text/html')) {
        const contentAnalysis = await this.analyzeContent(url)
        metadata.rawData!.contentAnalysis = contentAnalysis

        if (contentAnalysis.estimatedWordCount) {
          metadata.wordCount = contentAnalysis.estimatedWordCount
        }

        if (contentAnalysis.estimatedReadingTime) {
          metadata.readingTime = contentAnalysis.estimatedReadingTime
        }
      }

      return metadata

    } catch (error) {
      console.warn('通用元数据提取失败:', error)

      return {
        title: this.extractTitleFromUrl(url),
        rawData: {
          error: error instanceof Error ? error.message : '未知错误',
          source: 'fallback',
          extractedAt: new Date().toISOString()
        }
      }
    }
  }

  /**
   * 获取网页基本信息
   */
  private async fetchWebpageInfo(url: string): Promise<WebpageInfo> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      let currentUrl = url
      let redirectCount = 0
      let finalResponse: Response | null = null

      // 处理重定向
      while (redirectCount < this.config.maxRedirects) {
        const response = await fetch(currentUrl, {
          signal: controller.signal,
          method: 'HEAD', // 使用HEAD方法减少数据传输
          redirect: 'manual' // 手动处理重定向
        })

        if (response.status >= 300 && response.status < 400) {
          // 处理重定向
          const location = response.headers.get('location')
          if (!location) {
            finalResponse = response
            break
          }

          currentUrl = new URL(location, currentUrl).toString()
          redirectCount++
          continue
        }

        finalResponse = response
        break
      }

      clearTimeout(timeoutId)

      if (!finalResponse) {
        throw new Error('无法获取网页信息')
      }

      // 获取HTML内容以提取元数据
      const htmlResponse = await fetch(currentUrl, {
        signal: controller.signal,
        method: 'GET'
      })

      if (!htmlResponse.ok) {
        throw new Error(`HTTP ${htmlResponse.status}`)
      }

      const htmlText = await htmlResponse.text()

      // 解析HTML提取元数据
      const metadata = this.extractMetadataFromHTML(htmlText, currentUrl)

      return {
        url,
        finalUrl: currentUrl,
        title: metadata.title,
        description: metadata.description,
        keywords: metadata.keywords,
        language: metadata.language,
        charset: metadata.charset,
        contentType: finalResponse.headers.get('content-type') || undefined,
        contentLength: parseInt(finalResponse.headers.get('content-length') || '0', 10) || undefined,
        lastModified: finalResponse.headers.get('last-modified') || undefined,
        isRedirected: redirectCount > 0,
        redirectCount
      }

    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * 从HTML提取元数据
   */
  private extractMetadataFromHTML(html: string, url: string): {
    title?: string
    description?: string
    keywords?: string[]
    language?: string
    charset?: string
  } {
    const result = {
      title: undefined as string | undefined,
      description: undefined as string | undefined,
      keywords: undefined as string[] | undefined,
      language: undefined as string | undefined,
      charset: undefined as string | undefined
    }

    try {
      // 使用正则表达式提取基本元数据
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (titleMatch && titleMatch[1]) {
        result.title = titleMatch[1].trim()
      }

      // 提取meta标签
      const metaTags = html.match(/<meta[^>]+>/gi) || []

      for (const tag of metaTags) {
        // description
        const descMatch = tag.match(/name=["']description["'][^>]+content=["']([^"']+)["']/i)
        if (descMatch && descMatch[1]) {
          result.description = descMatch[1].trim()
        }

        // keywords
        const keywordsMatch = tag.match(/name=["']keywords["'][^>]+content=["']([^"']+)["']/i)
        if (keywordsMatch && keywordsMatch[1]) {
          result.keywords = keywordsMatch[1].split(',').map(k => k.trim()).filter(k => k)
        }

        // charset
        const charsetMatch = tag.match(/charset=["']([^"']+)["']/i)
        if (charsetMatch && charsetMatch[1]) {
          result.charset = charsetMatch[1].toLowerCase()
        }
      }

      // 提取html lang属性
      const langMatch = html.match(/<html[^>]+lang=["']([^"']+)["']/i)
      if (langMatch && langMatch[1]) {
        result.language = langMatch[1].toLowerCase()
      }

      // 如果title为空，尝试从URL提取
      if (!result.title) {
        result.title = this.extractTitleFromUrl(url)
      }

    } catch (error) {
      console.warn('HTML元数据提取失败:', error)
    }

    return result
  }

  /**
   * 分析内容
   */
  private async analyzeContent(url: string): Promise<ContentAnalysis> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const html = await response.text()

      // 简单的内容分析
      const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      const wordCount = textContent.split(/\s+/).length

      // 检测图片
      const hasImages = /<img[^>]+>/i.test(html)

      // 检测视频
      const hasVideos = /<(video|iframe)[^>]+>/i.test(html)

      // 检测表单
      const hasForms = /<form[^>]+>/i.test(html)

      // 启发式判断内容类型
      const isArticleLike = this.isArticleLikeContent(html, textContent)
      const isBlogLike = this.isBlogLikeContent(html, url)
      const isNewsLike = this.isNewsLikeContent(html, url)
      const isDocumentationLike = this.isDocumentationLikeContent(html, url)

      // 估算阅读时间（按每分钟200字计算）
      const estimatedReadingTime = Math.ceil(wordCount / 200)

      return {
        estimatedWordCount: wordCount,
        estimatedReadingTime,
        hasImages,
        hasVideos,
        hasForms,
        isArticleLike,
        isBlogLike,
        isNewsLike,
        isDocumentationLike,
        primaryLanguage: this.detectLanguage(textContent)
      }

    } catch (error) {
      console.warn('内容分析失败:', error)
      return {
        estimatedWordCount: 0,
        estimatedReadingTime: 0,
        hasImages: false,
        hasVideos: false,
        hasForms: false,
        isArticleLike: false,
        isBlogLike: false,
        isNewsLike: false,
        isDocumentationLike: false
      }
    }
  }

  /**
   * 启发式分析
   */
  private analyzeByHeuristics(webpageInfo: WebpageInfo): {
    contentType: ContentType
    confidence: number
  } {
    const { title, description, contentType, url } = webpageInfo
    const lowerTitle = title?.toLowerCase() || ''
    const lowerDescription = description?.toLowerCase() || ''
    const lowerUrl = url.toLowerCase()

    // 检查URL路径特征
    const path = new URL(url).pathname.toLowerCase()

    // 文章类特征
    if (
      path.includes('/article/') ||
      path.includes('/blog/') ||
      path.includes('/post/') ||
      path.includes('/entry/') ||
      lowerTitle.includes('blog') ||
      lowerTitle.includes('article') ||
      lowerTitle.includes('post')
    ) {
      return { contentType: 'article', confidence: 0.8 }
    }

    // 文档类特征
    if (
      path.includes('/docs/') ||
      path.includes('/documentation/') ||
      path.includes('/guide/') ||
      path.includes('/tutorial/') ||
      lowerTitle.includes('docs') ||
      lowerTitle.includes('documentation') ||
      lowerTitle.includes('guide') ||
      lowerTitle.includes('tutorial')
    ) {
      return { contentType: 'documentation', confidence: 0.75 }
    }

    // 新闻类特征
    if (
      path.includes('/news/') ||
      path.includes('/press/') ||
      lowerTitle.includes('news') ||
      lowerTitle.includes('press release')
    ) {
      return { contentType: 'article', confidence: 0.7 }
    }

    // 基于内容类型判断
    if (contentType?.includes('application/pdf')) {
      return { contentType: 'documentation', confidence: 0.9 }
    }

    if (contentType?.includes('image/')) {
      return { contentType: 'image_gallery', confidence: 0.8 }
    }

    if (contentType?.includes('video/')) {
      return { contentType: 'video', confidence: 0.9 }
    }

    // 默认返回通用类型
    return { contentType: 'generic', confidence: 0.5 }
  }

  /**
   * 检测平台特征
   */
  private detectPlatformFeatures(webpageInfo: WebpageInfo): {
    platform: PlatformType
    confidence: number
  } {
    const { url, title, description } = webpageInfo
    const lowerUrl = url.toLowerCase()
    const lowerTitle = title?.toLowerCase() || ''
    const lowerDescription = description?.toLowerCase() || ''

    // 检查已知平台特征
    const platformPatterns: Array<{
      platform: PlatformType
      patterns: string[]
      confidence: number
    }> = [
      // 技术博客平台
      { platform: 'medium', patterns: ['medium.com'], confidence: 0.9 },
      { platform: 'devto', patterns: ['dev.to'], confidence: 0.9 },
      { platform: 'hackernews', patterns: ['news.ycombinator.com'], confidence: 0.9 },

      // 问答平台
      { platform: 'stackoverflow', patterns: ['stackoverflow.com'], confidence: 0.9 },
      { platform: 'zhihu', patterns: ['zhihu.com'], confidence: 0.9 },

      // 代码平台
      { platform: 'github', patterns: ['github.com'], confidence: 0.95 },

      // 社交媒体
      { platform: 'twitter', patterns: ['twitter.com', 'x.com'], confidence: 0.9 },
      { platform: 'weibo', patterns: ['weibo.com'], confidence: 0.9 },
      { platform: 'reddit', patterns: ['reddit.com'], confidence: 0.9 }
    ]

    for (const { platform, patterns, confidence } of platformPatterns) {
      for (const pattern of patterns) {
        if (lowerUrl.includes(pattern)) {
          return { platform, confidence }
        }
      }
    }

    // 检查标题或描述中的平台特征
    const contentPatterns: Array<{
      platform: PlatformType
      keywords: string[]
      confidence: number
    }> = [
      { platform: 'medium', keywords: ['medium', '@medium'], confidence: 0.7 },
      { platform: 'github', keywords: ['github', 'repo', 'repository'], confidence: 0.7 },
      { platform: 'twitter', keywords: ['twitter', 'tweet', '@'], confidence: 0.6 }
    ]

    for (const { platform, keywords, confidence } of contentPatterns) {
      for (const keyword of keywords) {
        if (lowerTitle.includes(keyword) || lowerDescription.includes(keyword)) {
          return { platform, confidence: confidence * 0.8 }
        }
      }
    }

    return { platform: 'generic', confidence: 0.1 }
  }

  /**
   * 判断是否为文章类内容
   */
  private isArticleLikeContent(html: string, textContent: string): boolean {
    // 检查常见的文章HTML结构
    const hasArticleTag = /<article[^>]+>/i.test(html)
    const hasMainTag = /<main[^>]+>/i.test(html)

    // 检查文本长度和结构
    const wordCount = textContent.split(/\s+/).length
    const paragraphCount = (html.match(/<p[^>]+>/gi) || []).length

    // 文章通常有较多的段落和文字
    return hasArticleTag || hasMainTag || (wordCount > 300 && paragraphCount > 3)
  }

  /**
   * 判断是否为博客类内容
   */
  private isBlogLikeContent(html: string, url: string): boolean {
    const lowerUrl = url.toLowerCase()
    const path = new URL(url).pathname.toLowerCase()

    // 博客特征
    const hasBlogInUrl = lowerUrl.includes('blog') || path.includes('/blog/')
    const hasDateInUrl = /\d{4}\/\d{2}\/\d{2}/.test(url) || /\d{4}-\d{2}-\d{2}/.test(url)

    // 检查博客常见的meta标签
    const hasBlogMeta = /<meta[^>]+(name|property)=["'](blog|weblog)["'][^>]+>/i.test(html)

    return hasBlogInUrl || hasDateInUrl || hasBlogMeta
  }

  /**
   * 判断是否为新闻类内容
   */
  private isNewsLikeContent(html: string, url: string): boolean {
    const lowerUrl = url.toLowerCase()
    const path = new URL(url).pathname.toLowerCase()

    // 新闻特征
    const hasNewsInUrl = lowerUrl.includes('news') || path.includes('/news/')
    const hasPressInUrl = lowerUrl.includes('press') || path.includes('/press/')

    // 检查新闻常见的meta标签
    const hasNewsMeta = /<meta[^>]+(name|property)=["'](news|press)["'][^>]+>/i.test(html)

    // 检查发布时间
    const hasPublishDate = /<meta[^>]+(name|property)=["'](pubdate|publish_date)["'][^>]+>/i.test(html)

    return hasNewsInUrl || hasPressInUrl || hasNewsMeta || hasPublishDate
  }

  /**
   * 判断是否为文档类内容
   */
  private isDocumentationLikeContent(html: string, url: string): boolean {
    const lowerUrl = url.toLowerCase()
    const path = new URL(url).pathname.toLowerCase()

    // 文档特征
    const hasDocsInUrl = lowerUrl.includes('docs') || path.includes('/docs/')
    const hasGuideInUrl = lowerUrl.includes('guide') || path.includes('/guide/')
    const hasTutorialInUrl = lowerUrl.includes('tutorial') || path.includes('/tutorial/')

    // 检查文档结构
    const hasNav = /<nav[^>]+>/i.test(html)
    const hasSidebar = /class=["'][^"']*(sidebar|nav)[^"']*["']/i.test(html)
    const hasToc = /class=["'][^"']*(toc|table-of-contents)[^"']*["']/i.test(html)

    return hasDocsInUrl || hasGuideInUrl || hasTutorialInUrl || hasNav || hasSidebar || hasToc
  }

  /**
   * 检测文本语言
   */
  private detectLanguage(text: string): string | undefined {
    // 简单的中英文检测
    const chineseChars = text.match(/[\u4e00-\u9fff]/g) || []
    const englishWords = text.match(/\b[a-zA-Z]{3,}\b/g) || []

    if (chineseChars.length > englishWords.length * 2) {
      return 'zh'
    } else if (englishWords.length > chineseChars.length * 2) {
      return 'en'
    }

    return undefined
  }

  /**
   * 从URL提取标题
   */
  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      const path = urlObj.pathname.split('/').pop() || ''
      const decoded = decodeURIComponent(path)
      return decoded.replace(/[-_]/g, ' ').trim() || urlObj.hostname
    } catch {
      return url
    }
  }
}

/**
 * 创建通用检测器实例
 */
export function createGenericDetector(config?: GenericDetectorConfig): GenericDetector {
  return new GenericDetector(config)
}

/**
 * 检测URL是否为通用网站
 */
export async function isGenericUrl(url: string): Promise<boolean> {
  const detector = new GenericDetector()
  const result = await detector.detect(url)
  return result.isGeneric
}