/**
 * 内容提取服务
 * 集成Readability.js和turndown，提取网页正文并转换为Markdown
 */

import { Readability } from '@mozilla/readability'
import { JSDOM } from 'jsdom'
import TurndownService from 'turndown'
import { FetchResult } from './fetcher'

/**
 * 提取配置选项
 */
export interface ExtractOptions {
  /** 是否保留图片 */
  keepImages?: boolean
  /** 是否保留链接 */
  keepLinks?: boolean
  /** 是否保留表格 */
  keepTables?: boolean
  /** 是否保留代码块 */
  keepCode?: boolean
  /** 最大提取字符数 */
  maxLength?: number
  /** 最小提取字符数 */
  minLength?: number
  /** 自定义Readability配置 */
  readabilityOptions?: ConstructorParameters<typeof Readability>[1]
}

/**
 * 提取结果
 */
export interface ExtractResult {
  /** 文章标题 */
  title: string
  /** 文章作者 */
  author?: string
  /** 发布时间 */
  publishedAt?: string
  /** 文章正文（HTML） */
  contentHtml: string
  /** 文章正文（Markdown） */
  contentMarkdown: string
  /** 文章摘要 */
  excerpt?: string
  /** 封面图片 */
  coverImage?: string
  /** 字数统计 */
  wordCount: number
  /** 阅读时间（分钟） */
  readingTime: number
  /** 语言 */
  language?: string
  /** 网站名称 */
  siteName?: string
  /** 提取的元数据 */
  metadata: {
    /** Open Graph元数据 */
    og?: Record<string, string>
    /** Twitter Card元数据 */
    twitter?: Record<string, string>
    /** 通用meta标签 */
    meta?: Record<string, string>
    /** JSON-LD数据 */
    jsonLd?: any[]
  }
  /** 提取质量评分（0-1） */
  qualityScore: number
  /** 警告信息 */
  warnings: string[]
  /** 提取耗时（毫秒） */
  extractTime: number
}

/**
 * 提取错误
 */
export class ExtractError extends Error {
  constructor(
    message: string,
    public url: string,
    public reason?: string
  ) {
    super(message)
    this.name = 'ExtractError'
  }
}

/**
 * 默认配置
 */
const DEFAULT_OPTIONS: Required<ExtractOptions> = {
  keepImages: true,
  keepLinks: true,
  keepTables: true,
  keepCode: true,
  maxLength: 1000000, // 100万字符
  minLength: 100, // 最少100字符
  readabilityOptions: {
    debug: false,
    maxElemsToParse: 1000000,
    nbTopCandidates: 5,
    charThreshold: 500
  }
}

/**
 * 内容提取器
 */
export class ContentExtractor {
  private turndownService: TurndownService
  private options: Required<ExtractOptions>

  constructor(options: ExtractOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.turndownService = this.createTurndownService()
  }

  /**
   * 从抓取结果中提取内容
   */
  async extract(fetchResult: FetchResult, options: ExtractOptions = {}): Promise<ExtractResult> {
    const startTime = Date.now()
    const mergedOptions = { ...this.options, ...options }
    const warnings: string[] = []

    try {
      // 创建DOM
      const dom = new JSDOM(fetchResult.content, {
        url: fetchResult.finalUrl,
        contentType: fetchResult.contentType,
        runScripts: 'outside-only'
      })

      const document = dom.window.document

      // 提取元数据
      const metadata = this.extractMetadata(document)

      // 使用Readability提取正文
      const readability = new Readability(document, mergedOptions.readabilityOptions)
      const article = readability.parse()

      if (!article) {
        throw new ExtractError('无法提取文章正文', fetchResult.url, 'Readability解析失败')
      }

      // 类型断言：Readability.parse()返回的内容是字符串
      const articleContent = article.content as string

      // 验证提取结果
      if (!article.title || article.title.trim().length === 0) {
        warnings.push('未提取到标题，使用备选标题')
        article.title = metadata.og?.title ||
                       metadata.twitter?.title ||
                       metadata.meta?.title ||
                       '未命名文章'
      }

      if (!articleContent || articleContent.length < mergedOptions.minLength) {
        warnings.push(`正文长度不足 (${articleContent?.length || 0}字符)`)
      }

      if (articleContent && articleContent.length > mergedOptions.maxLength) {
        warnings.push(`正文超过最大长度 (${articleContent.length}字符)，已截断`)
        // 这里可以添加截断逻辑
      }

      // 转换为Markdown
      const markdown = this.turndownService.turndown(articleContent)

      // 计算字数（基于Markdown，排除标记字符）
      const wordCount = this.countWords(markdown)

      // 计算阅读时间（按200字/分钟）
      const readingTime = Math.ceil(wordCount / 200)

      // 计算质量评分
      const qualityScore = this.calculateQualityScore(article as any, wordCount, warnings)

      const extractTime = Date.now() - startTime

      return {
        title: article.title,
        author: article.byline || metadata.og?.author || metadata.meta?.author,
        publishedAt: article.publishedTime || metadata.og?.published_time || metadata.meta?.published_time,
        contentHtml: articleContent,
        contentMarkdown: markdown,
        excerpt: article.excerpt || metadata.og?.description || metadata.meta?.description,
        coverImage: (article as any).leadImage || metadata.og?.image || metadata.twitter?.image,
        wordCount,
        readingTime,
        language: article.lang || metadata.og?.locale || metadata.meta?.language,
        siteName: metadata.og?.site_name || metadata.meta?.site_name,
        metadata,
        qualityScore,
        warnings,
        extractTime
      } as ExtractResult

    } catch (error) {
      if (error instanceof ExtractError) {
        throw error
      }
      throw new ExtractError(
        '内容提取失败',
        fetchResult.url,
        error instanceof Error ? error.message : '未知错误'
      )
    }
  }

  /**
   * 创建Turndown服务
   */
  private createTurndownService(): TurndownService {
    const service = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
      strongDelimiter: '**'
    })

    // 添加自定义规则
    if (this.options.keepImages) {
      service.addRule('images', {
        filter: 'img',
        replacement: (content, node) => {
          const img = node as HTMLImageElement
          const alt = img.alt || ''
          const src = img.src || ''
          const title = img.title || ''

          if (!src) return ''

          const titleAttr = title ? ` "${title}"` : ''
          return `![${alt}](${src}${titleAttr})`
        }
      })
    }

    if (this.options.keepTables) {
      service.keep(['table', 'thead', 'tbody', 'tr', 'th', 'td'])
    }

    if (this.options.keepCode) {
      service.addRule('codeBlocks', {
        filter: ['pre', 'code'],
        replacement: (content, node) => {
          const element = node as HTMLElement
          const language = element.getAttribute('data-language') ||
                          element.className.match(/language-(\w+)/)?.[1] || ''

          if (element.tagName.toLowerCase() === 'pre') {
            return `\`\`\`${language}\n${content}\n\`\`\``
          }
          return `\`${content}\``
        }
      })
    }

    // 保留视频和音频标签（转换为链接）
    service.addRule('media', {
      filter: ['video', 'audio', 'iframe'],
      replacement: (content, node) => {
        const element = node as HTMLElement
        const src = (element as HTMLVideoElement).src ||
                   (element as HTMLAudioElement).src ||
                   (element as HTMLIFrameElement).src
        const title = element.getAttribute('title') || element.getAttribute('aria-label') || ''

        if (src) {
          return `[${title || '媒体内容'}](${src})`
        }
        return ''
      }
    })

    return service
  }

  /**
   * 提取元数据
   */
  private extractMetadata(document: Document): ExtractResult['metadata'] {
    const metadata: ExtractResult['metadata'] = {
      og: {},
      twitter: {},
      meta: {},
      jsonLd: []
    }

    // 提取Open Graph元数据
    const ogTags = document.querySelectorAll('meta[property^="og:"]')
    ogTags.forEach(tag => {
      const property = tag.getAttribute('property')?.replace('og:', '') || ''
      const content = tag.getAttribute('content') || ''
      if (property && content) {
        metadata.og![property] = content
      }
    })

    // 提取Twitter Card元数据
    const twitterTags = document.querySelectorAll('meta[name^="twitter:"]')
    twitterTags.forEach(tag => {
      const name = tag.getAttribute('name')?.replace('twitter:', '') || ''
      const content = tag.getAttribute('content') || ''
      if (name && content) {
        metadata.twitter![name] = content
      }
    })

    // 提取通用meta标签
    const metaTags = ['title', 'description', 'author', 'keywords', 'published_time', 'language', 'site_name']
    metaTags.forEach(name => {
      const tag = document.querySelector(`meta[name="${name}"]`) ||
                  document.querySelector(`meta[property="${name}"]`)
      if (tag) {
        const content = tag.getAttribute('content') || ''
        if (content) {
          metadata.meta![name] = content
        }
      }
    })

    // 提取JSON-LD数据
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]')
    jsonLdScripts.forEach(script => {
      try {
        const json = JSON.parse(script.textContent || '{}')
        metadata.jsonLd!.push(json)
      } catch (error) {
        // 忽略解析错误
      }
    })

    return metadata
  }

  /**
   * 计算字数
   */
  private countWords(text: string): number {
    // 移除Markdown标记字符和多余空格
    const cleanText = text
      .replace(/[#*`~\[\]\(\)!]/g, ' ') // 移除Markdown标记
      .replace(/\s+/g, ' ') // 合并空格
      .trim()

    // 按空格分割计算单词数（英文）或字符数（中文）
    const hasCJK = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(cleanText)

    if (hasCJK) {
      // 中日韩文字：按字符计数
      return cleanText.replace(/\s/g, '').length
    } else {
      // 英文等：按单词计数
      return cleanText.split(/\s+/).filter(word => word.length > 0).length
    }
  }

  /**
   * 计算质量评分
   */
  private calculateQualityScore(
    article: ReturnType<Readability['parse']>,
    wordCount: number,
    warnings: string[]
  ): number {
    let score = 0.5 // 基础分

    // 标题质量
    if (article?.title && article.title.length > 5) {
      score += 0.1
    }

    // 正文长度
    if (wordCount > 500) {
      score += 0.2
    } else if (wordCount > 200) {
      score += 0.1
    }

    // 是否有作者信息
    if (article?.byline) {
      score += 0.1
    }

    // 是否有发布时间
    if (article?.publishedTime) {
      score += 0.1
    }

    // 是否有摘要
    if (article?.excerpt) {
      score += 0.05
    }

    // 是否有封面图片
    if ((article as any)?.leadImage) {
      score += 0.05
    }

    // 警告扣分
    if (warnings.length > 0) {
      score -= Math.min(0.3, warnings.length * 0.05)
    }

    // 确保在0-1范围内
    return Math.max(0, Math.min(1, score))
  }

  /**
   * 更新配置
   */
  updateOptions(options: ExtractOptions): void {
    this.options = { ...this.options, ...options }
    this.turndownService = this.createTurndownService()
  }
}

/**
 * 默认提取器实例
 */
export const defaultExtractor = new ContentExtractor()

/**
 * 便捷函数：提取内容
 */
export async function extractContent(
  fetchResult: FetchResult,
  options: ExtractOptions = {}
): Promise<ExtractResult> {
  return defaultExtractor.extract(fetchResult, options)
}