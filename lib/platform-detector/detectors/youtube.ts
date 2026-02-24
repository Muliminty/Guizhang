/**
 * YouTube平台检测器
 * 专门处理YouTube视频的检测和元数据提取
 */

import { PlatformType, PlatformMetadata } from '../../../types'

/**
 * YouTube检测器配置
 */
export interface YouTubeDetectorConfig {
  apiKey?: string
  enableAPI?: boolean
  timeout?: number
}

/**
 * YouTube视频信息接口
 */
export interface YouTubeVideoInfo {
  id: string
  title: string
  description: string
  channelTitle: string
  channelId: string
  publishedAt: string
  duration: string // ISO 8601格式
  viewCount: string
  likeCount?: string
  commentCount?: string
  tags?: string[]
  thumbnails: {
    default: { url: string; width: number; height: number }
    medium: { url: string; width: number; height: number }
    high: { url: string; width: number; height: number }
    standard?: { url: string; width: number; height: number }
    maxres?: { url: string; width: number; height: number }
  }
  liveBroadcastContent?: 'none' | 'upcoming' | 'live' | 'completed'
}

/**
 * YouTube检测器
 */
export class YouTubeDetector {
  private config: Required<YouTubeDetectorConfig>

  constructor(config: YouTubeDetectorConfig = {}) {
    this.config = {
      apiKey: '',
      enableAPI: true,
      timeout: 5000,
      ...config
    }
  }

  /**
   * 检测YouTube URL
   * @param url 要检测的URL
   * @returns 检测结果
   */
  async detect(url: string): Promise<{
    isYouTube: boolean
    videoId?: string
    type?: 'video' | 'short' | 'playlist' | 'channel'
    confidence: number
  }> {
    const normalizedUrl = url.trim().toLowerCase()

    // 检查是否为YouTubeURL
    const youtubePatterns = [
      // 视频
      { pattern: /youtube\.com\/watch\?v=([\w-]{11})/, type: 'video', confidence: 0.99, extractor: (m: RegExpMatchArray) => ({ videoId: m[1] }) },
      { pattern: /youtu\.be\/([\w-]{11})/, type: 'video', confidence: 0.99, extractor: (m: RegExpMatchArray) => ({ videoId: m[1] }) },

      // Shorts
      { pattern: /youtube\.com\/shorts\/([\w-]+)/, type: 'short', confidence: 0.98, extractor: (m: RegExpMatchArray) => ({ videoId: m[1] }) },

      // 播放列表
      { pattern: /youtube\.com\/playlist\?list=([\w-]+)/, type: 'playlist', confidence: 0.97, extractor: (m: RegExpMatchArray) => ({ videoId: m[1] }) },

      // 频道
      { pattern: /youtube\.com\/(?:c\/|channel\/|user\/|@)([\w-]+)/, type: 'channel', confidence: 0.95, extractor: (m: RegExpMatchArray) => ({ videoId: m[1] }) },

      // 通用YouTube域名
      { pattern: /youtube\.com/, type: 'video', confidence: 0.8, extractor: () => ({ videoId: undefined }) }
    ]

    for (const { pattern, type, confidence, extractor } of youtubePatterns) {
      const match = normalizedUrl.match(pattern)
      if (match) {
        const extracted = extractor(match)
        return {
          isYouTube: true,
          videoId: extracted.videoId,
          type,
          confidence
        }
      }
    }

    return {
      isYouTube: false,
      confidence: 0
    }
  }

  /**
   * 提取YouTube视频ID
   */
  extractVideoId(url: string): string | null {
    const patterns = [
      /youtube\.com\/watch\?v=([\w-]{11})/,
      /youtu\.be\/([\w-]{11})/,
      /youtube\.com\/shorts\/([\w-]+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  }

  /**
   * 提取YouTube元数据
   * @param url YouTube URL
   * @returns 元数据
   */
  async extractMetadata(url: string): Promise<PlatformMetadata> {
    const videoId = this.extractVideoId(url)

    if (!videoId) {
      throw new Error('无法从URL中提取YouTube视频ID')
    }

    try {
      // 尝试使用YouTube Data API
      if (this.config.enableAPI && this.config.apiKey) {
        const apiMetadata = await this.fetchFromYouTubeAPI(videoId)
        if (apiMetadata) {
          return this.transformAPIResponse(apiMetadata)
        }
      }

      // 回退到OG标签提取
      const ogMetadata = await this.extractFromOGTags(url)
      return ogMetadata

    } catch (error) {
      console.warn('YouTube元数据提取失败:', error)

      // 返回基础元数据
      return {
        platformId: videoId,
        title: `YouTube视频 ${videoId}`,
        rawData: {
          error: error instanceof Error ? error.message : '未知错误',
          source: 'fallback'
        }
      }
    }
  }

  /**
   * 从YouTube Data API获取数据
   */
  private async fetchFromYouTubeAPI(videoId: string): Promise<YouTubeVideoInfo | null> {
    if (!this.config.apiKey) {
      return null
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${this.config.apiKey}`,
        { signal: controller.signal }
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`YouTube API错误: ${response.status}`)
      }

      const data = await response.json()

      if (!data.items || data.items.length === 0) {
        return null
      }

      const item = data.items[0]
      return {
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        publishedAt: item.snippet.publishedAt,
        duration: item.contentDetails.duration,
        viewCount: item.statistics.viewCount,
        likeCount: item.statistics.likeCount,
        commentCount: item.statistics.commentCount,
        tags: item.snippet.tags,
        thumbnails: item.snippet.thumbnails,
        liveBroadcastContent: item.snippet.liveBroadcastContent
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('YouTube API请求超时')
      } else {
        console.warn('YouTube API请求失败:', error)
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

    return {
      platformId: videoId || undefined,
      title: `YouTube视频 ${videoId || '未知'}`,
      description: '通过OG标签提取的YouTube视频描述',
      thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : undefined,
      rawData: {
        source: 'og-tags',
        extractedAt: new Date().toISOString()
      }
    }
  }

  /**
   * 转换API响应为平台元数据
   */
  private transformAPIResponse(apiData: YouTubeVideoInfo): PlatformMetadata {
    // 解析ISO 8601时长格式
    const durationInSeconds = this.parseISODuration(apiData.duration)

    return {
      platformId: apiData.id,
      title: apiData.title,
      description: apiData.description,
      thumbnail: apiData.thumbnails.maxres?.url || apiData.thumbnails.high.url,
      duration: durationInSeconds,
      author: apiData.channelTitle,
      publishedAt: apiData.publishedAt,
      viewCount: parseInt(apiData.viewCount, 10) || undefined,
      likeCount: apiData.likeCount ? parseInt(apiData.likeCount, 10) : undefined,
      commentCount: apiData.commentCount ? parseInt(apiData.commentCount, 10) : undefined,
      tags: apiData.tags,
      isLive: apiData.liveBroadcastContent !== 'none',
      rawData: {
        source: 'youtube-api',
        channelId: apiData.channelId,
        liveBroadcastContent: apiData.liveBroadcastContent,
        extractedAt: new Date().toISOString()
      }
    }
  }

  /**
   * 解析ISO 8601时长格式
   */
  private parseISODuration(duration: string): number {
    // ISO 8601格式: PT1H2M3S
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)

    if (!match) {
      return 0
    }

    const hours = parseInt(match[1] || '0', 10)
    const minutes = parseInt(match[2] || '0', 10)
    const seconds = parseInt(match[3] || '0', 10)

    return hours * 3600 + minutes * 60 + seconds
  }

  /**
   * 验证YouTube视频ID
   */
  isValidVideoId(videoId: string): boolean {
    // YouTube视频ID通常是11个字符，包含字母、数字、下划线和连字符
    return /^[\w-]{11}$/.test(videoId)
  }

  /**
   * 生成YouTube嵌入代码
   */
  generateEmbedCode(videoId: string, options: {
    width?: number
    height?: number
    autoplay?: boolean
    controls?: boolean
  } = {}): string {
    const {
      width = 560,
      height = 315,
      autoplay = false,
      controls = true
    } = options

    const params = new URLSearchParams()
    if (autoplay) params.append('autoplay', '1')
    if (!controls) params.append('controls', '0')

    const queryString = params.toString()
    const src = `https://www.youtube.com/embed/${videoId}${queryString ? `?${queryString}` : ''}`

    return `<iframe width="${width}" height="${height}" src="${src}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
  }

  /**
   * 获取视频的直接链接（用于下载或播放）
   */
  getDirectVideoUrl(videoId: string): string {
    // 注意：这可能需要额外的处理来获取实际的视频流URL
    return `https://www.youtube.com/watch?v=${videoId}`
  }
}

/**
 * 创建YouTube检测器实例
 */
export function createYouTubeDetector(config?: YouTubeDetectorConfig): YouTubeDetector {
  return new YouTubeDetector(config)
}

/**
 * 检测是否为YouTube URL
 */
export async function isYouTubeUrl(url: string): Promise<boolean> {
  const detector = new YouTubeDetector()
  const result = await detector.detect(url)
  return result.isYouTube
}

/**
 * 提取YouTube视频ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  const detector = new YouTubeDetector()
  return detector.extractVideoId(url)
}