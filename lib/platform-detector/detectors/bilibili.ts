/**
 * B站（Bilibili）平台检测器
 * 专门处理B站视频的检测和元数据提取
 */

import { PlatformType, PlatformMetadata } from '../../../types'

/**
 * B站检测器配置
 */
export interface BilibiliDetectorConfig {
  enableAPI?: boolean
  timeout?: number
  useOfficialAPI?: boolean
}

/**
 * B站视频信息接口
 */
export interface BilibiliVideoInfo {
  bvid?: string // 新的BV ID
  aid?: number  // 旧的AV ID
  title: string
  desc: string
  pic: string // 封面图URL
  owner: {
    mid: number
    name: string
    face: string // 头像URL
  }
  stat: {
    view: number
    danmaku: number
    reply: number
    favorite: number
    coin: number
    share: number
    like: number
  }
  duration: number // 秒
  pubdate: number // 发布时间戳
  ctime: number   // 创建时间戳
  videos?: number // 分P数量
  tid: number     // 分区ID
  tname: string   // 分区名称
  copyright: 1 | 2 // 1:原创 2:转载
}

/**
 * B站检测器
 */
export class BilibiliDetector {
  private config: Required<BilibiliDetectorConfig>

  constructor(config: BilibiliDetectorConfig = {}) {
    this.config = {
      enableAPI: true,
      timeout: 5000,
      useOfficialAPI: false, // B站官方API需要登录
      ...config
    }
  }

  /**
   * 检测B站 URL
   * @param url 要检测的URL
   * @returns 检测结果
   */
  async detect(url: string): Promise<{
    isBilibili: boolean
    videoId?: string
    type?: 'video' | 'bangumi' | 'article' | 'live' | 'user'
    bvid?: string
    aid?: number
    confidence: number
  }> {
    const normalizedUrl = url.trim().toLowerCase()

    // B站URL模式
    const bilibiliPatterns = [
      // 视频（BV ID）
      { pattern: /bilibili\.com\/video\/(bv[\w]+)/i, type: 'video', confidence: 0.99, extractor: (m: RegExpMatchArray) => ({ bvid: m[1], aid: undefined }) },

      // 视频（AV ID）
      { pattern: /bilibili\.com\/video\/av(\d+)/i, type: 'video', confidence: 0.98, extractor: (m: RegExpMatchArray) => ({ bvid: undefined, aid: parseInt(m[1], 10) }) },

      // 番剧
      { pattern: /bilibili\.com\/bangumi\/play\/(ss\d+|ep\d+)/i, type: 'bangumi', confidence: 0.97, extractor: (m: RegExpMatchArray) => ({ bvid: m[1], aid: undefined }) },

      // 专栏文章
      { pattern: /bilibili\.com\/read\/(cv\d+)/i, type: 'article', confidence: 0.96, extractor: (m: RegExpMatchArray) => ({ bvid: m[1], aid: undefined }) },

      // 直播
      { pattern: /live\.bilibili\.com\/(\d+)/i, type: 'live', confidence: 0.95, extractor: (m: RegExpMatchArray) => ({ bvid: m[1], aid: undefined }) },

      // 用户空间
      { pattern: /space\.bilibili\.com\/(\d+)/i, type: 'user', confidence: 0.94, extractor: (m: RegExpMatchArray) => ({ bvid: m[1], aid: undefined }) },

      // 短链接
      { pattern: /b23\.tv\/([\w]+)/i, type: 'video', confidence: 0.93, extractor: (m: RegExpMatchArray) => ({ bvid: m[1], aid: undefined }) },

      // 通用B站域名
      { pattern: /bilibili\.com/i, type: 'video', confidence: 0.8, extractor: () => ({ bvid: undefined, aid: undefined }) }
    ]

    for (const { pattern, type, confidence, extractor } of bilibiliPatterns) {
      const match = normalizedUrl.match(pattern)
      if (match) {
        const extracted = extractor(match)
        const videoId = extracted.bvid || (extracted.aid ? `av${extracted.aid}` : undefined)
        return {
          isBilibili: true,
          videoId,
          type,
          bvid: extracted.bvid,
          aid: extracted.aid,
          confidence
        }
      }
    }

    return {
      isBilibili: false,
      confidence: 0
    }
  }

  /**
   * 提取B站视频ID
   */
  extractVideoId(url: string): { bvid?: string; aid?: number } | null {
    const patterns = [
      // BV ID
      { pattern: /bilibili\.com\/video\/(bv[\w]+)/i, extractor: (m: RegExpMatchArray) => ({ bvid: m[1] }) },

      // AV ID
      { pattern: /bilibili\.com\/video\/av(\d+)/i, extractor: (m: RegExpMatchArray) => ({ aid: parseInt(m[1], 10) }) },

      // 短链接
      { pattern: /b23\.tv\/([\w]+)/i, extractor: (m: RegExpMatchArray) => ({ bvid: m[1] }) }
    ]

    for (const { pattern, extractor } of patterns) {
      const match = url.match(pattern)
      if (match) {
        return extractor(match)
      }
    }

    return null
  }

  /**
   * 提取B站元数据
   * @param url B站 URL
   * @returns 元数据
   */
  async extractMetadata(url: string): Promise<PlatformMetadata> {
    const videoId = this.extractVideoId(url)

    if (!videoId) {
      throw new Error('无法从URL中提取B站视频ID')
    }

    try {
      // 尝试使用B站API
      if (this.config.enableAPI) {
        const apiMetadata = await this.fetchFromBilibiliAPI(videoId)
        if (apiMetadata) {
          return this.transformAPIResponse(apiMetadata)
        }
      }

      // 回退到OG标签提取
      const ogMetadata = await this.extractFromOGTags(url)
      return ogMetadata

    } catch (error) {
      console.warn('B站元数据提取失败:', error)

      // 返回基础元数据
      const idStr = videoId.bvid || `av${videoId.aid}`
      return {
        platformId: idStr,
        title: `B站视频 ${idStr}`,
        rawData: {
          error: error instanceof Error ? error.message : '未知错误',
          source: 'fallback'
        }
      }
    }
  }

  /**
   * 从B站API获取数据
   */
  private async fetchFromBilibiliAPI(videoId: { bvid?: string; aid?: number }): Promise<BilibiliVideoInfo | null> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      let apiUrl: string

      if (videoId.bvid) {
        // 使用BV ID
        apiUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${videoId.bvid}`
      } else if (videoId.aid) {
        // 使用AV ID
        apiUrl = `https://api.bilibili.com/x/web-interface/view?aid=${videoId.aid}`
      } else {
        return null
      }

      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.bilibili.com'
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`B站API错误: ${response.status}`)
      }

      const data = await response.json()

      if (data.code !== 0 || !data.data) {
        console.warn('B站API返回错误:', data.message)
        return null
      }

      return data.data

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('B站API请求超时')
      } else {
        console.warn('B站API请求失败:', error)
      }
      return null
    }
  }

  /**
   * 从OG标签提取元数据
   */
  private async extractFromOGTags(url: string): Promise<PlatformMetadata> {
    // 这里应该实现实际的OG标签提取逻辑
    // 目前返回模拟数据
    const videoId = this.extractVideoId(url)
    const idStr = videoId?.bvid || (videoId?.aid ? `av${videoId.aid}` : '未知')

    return {
      platformId: idStr,
      title: `B站视频 ${idStr}`,
      description: '通过OG标签提取的B站视频描述',
      thumbnail: `https://example.com/bilibili-thumbnail.jpg`,
      rawData: {
        source: 'og-tags',
        extractedAt: new Date().toISOString()
      }
    }
  }

  /**
   * 转换API响应为平台元数据
   */
  private transformAPIResponse(apiData: BilibiliVideoInfo): PlatformMetadata {
    return {
      platformId: apiData.bvid || `av${apiData.aid}`,
      title: apiData.title,
      description: apiData.desc,
      thumbnail: apiData.pic,
      duration: apiData.duration,
      author: apiData.owner.name,
      publishedAt: new Date(apiData.pubdate * 1000).toISOString(),
      viewCount: apiData.stat.view,
      likeCount: apiData.stat.like,
      commentCount: apiData.stat.reply,
      tags: [apiData.tname], // 使用分区名称作为标签
      rawData: {
        source: 'bilibili-api',
        ownerMid: apiData.owner.mid,
        copyright: apiData.copyright === 1 ? '原创' : '转载',
        videos: apiData.videos, // 分P数量
        danmakuCount: apiData.stat.danmaku,
        favoriteCount: apiData.stat.favorite,
        coinCount: apiData.stat.coin,
        shareCount: apiData.stat.share,
        extractedAt: new Date().toISOString()
      }
    }
  }

  /**
   * 验证B站视频ID
   */
  isValidVideoId(videoId: string): boolean {
    // BV ID: BV开头，后跟10个base58字符
    if (videoId.startsWith('BV')) {
      return /^BV[\w]{10}$/.test(videoId)
    }

    // AV ID: av开头，后跟数字
    if (videoId.startsWith('av')) {
      return /^av\d+$/.test(videoId)
    }

    return false
  }

  /**
   * 生成B站嵌入代码
   */
  generateEmbedCode(videoId: string, options: {
    width?: number
    height?: number
    autoplay?: boolean
    page?: number // 分P页码
  } = {}): string {
    const {
      width = 560,
      height = 315,
      autoplay = false,
      page = 1
    } = options

    let bvid: string
    let aid: string | undefined

    if (videoId.startsWith('BV')) {
      bvid = videoId
    } else if (videoId.startsWith('av')) {
      aid = videoId.substring(2)
      bvid = '' // 需要先获取BV ID
    } else {
      throw new Error('无效的B站视频ID')
    }

    const params = new URLSearchParams()
    if (autoplay) params.append('autoplay', '1')
    if (page > 1) params.append('page', page.toString())

    let src: string
    if (bvid) {
      src = `https://player.bilibili.com/player.html?bvid=${bvid}`
    } else if (aid) {
      src = `https://player.bilibili.com/player.html?aid=${aid}`
    } else {
      throw new Error('无法生成嵌入代码')
    }

    if (params.toString()) {
      src += `&${params.toString()}`
    }

    return `<iframe width="${width}" height="${height}" src="${src}" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>`
  }

  /**
   * 获取视频的直接链接
   */
  getDirectVideoUrl(videoId: string): string {
    if (videoId.startsWith('BV')) {
      return `https://www.bilibili.com/video/${videoId}`
    } else if (videoId.startsWith('av')) {
      return `https://www.bilibili.com/video/${videoId}`
    } else {
      throw new Error('无效的B站视频ID')
    }
  }

  /**
   * 转换AV ID为BV ID（如果需要）
   */
  async convertAidToBvid(aid: number): Promise<string | null> {
    try {
      const response = await fetch(`https://api.bilibili.com/x/web-interface/view?aid=${aid}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.bilibili.com'
        }
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      if (data.code === 0 && data.data && data.data.bvid) {
        return data.data.bvid
      }

      return null
    } catch (error) {
      console.warn('AV ID转换失败:', error)
      return null
    }
  }
}

/**
 * 创建B站检测器实例
 */
export function createBilibiliDetector(config?: BilibiliDetectorConfig): BilibiliDetector {
  return new BilibiliDetector(config)
}

/**
 * 检测是否为B站 URL
 */
export async function isBilibiliUrl(url: string): Promise<boolean> {
  const detector = new BilibiliDetector()
  const result = await detector.detect(url)
  return result.isBilibili
}

/**
 * 提取B站视频ID
 */
export function extractBilibiliVideoId(url: string): { bvid?: string; aid?: number } | null {
  const detector = new BilibiliDetector()
  return detector.extractVideoId(url)
}