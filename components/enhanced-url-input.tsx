/**
 * 增强URL输入组件
 * 集成实时平台检测和内容类型识别
 */

'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { PlatformDetectionResult, PlatformType, ContentType, ProcessingStrategy } from '../types'
import { detectPlatform } from '../lib/platform-detector'

/**
 * 组件属性
 */
interface EnhancedUrlInputProps {
  /** 初始URL值 */
  initialUrl?: string
  /** 占位符文本 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否自动检测 */
  autoDetect?: boolean
  /** 检测延迟（毫秒） */
  detectionDelay?: number
  /** 检测完成回调 */
  onDetectionComplete?: (result: PlatformDetectionResult) => void
  /** URL变化回调 */
  onUrlChange?: (url: string) => void
  /** 提交回调 */
  onSubmit?: (url: string, detectionResult?: PlatformDetectionResult) => void
  /** 自定义类名 */
  className?: string
  /** 显示平台图标 */
  showPlatformIcon?: boolean
  /** 显示内容类型标签 */
  showContentType?: boolean
  /** 显示处理策略建议 */
  showStrategy?: boolean
}

/**
 * 平台图标映射
 */
const PLATFORM_ICONS: Record<PlatformType, string> = {
  youtube: '▶️',
  bilibili: '📺',
  twitter: '🐦',
  medium: '📝',
  zhihu: '❓',
  github: '💻',
  weibo: '🇨🇳',
  tiktok: '🎵',
  reddit: '👥',
  stackoverflow: '🔧',
  devto: '👨‍💻',
  hackernews: '📰',
  generic: '🌐'
}

/**
 * 平台颜色映射
 */
const PLATFORM_COLORS: Record<PlatformType, string> = {
  youtube: 'bg-red-100 text-red-800 border-red-200',
  bilibili: 'bg-pink-100 text-pink-800 border-pink-200',
  twitter: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-green-100 text-green-800 border-green-200',
  zhihu: 'bg-blue-50 text-blue-700 border-blue-100',
  github: 'bg-gray-100 text-gray-800 border-gray-200',
  weibo: 'bg-orange-100 text-orange-800 border-orange-200',
  tiktok: 'bg-black text-white border-black',
  reddit: 'bg-orange-50 text-orange-700 border-orange-100',
  stackoverflow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  devto: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  hackernews: 'bg-orange-100 text-orange-800 border-orange-200',
  generic: 'bg-gray-100 text-gray-600 border-gray-200'
}

/**
 * 内容类型标签映射
 */
const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  article: '文章',
  video: '视频',
  image_gallery: '图片集',
  tweet: '推文',
  code_repository: '代码仓库',
  documentation: '文档',
  discussion: '讨论',
  generic: '通用'
}

/**
 * 处理策略标签映射
 */
const STRATEGY_LABELS: Record<ProcessingStrategy, string> = {
  clip: '剪藏',
  watch_later: '稍后观看',
  bookmark: '书签',
  ignore: '忽略'
}

/**
 * 处理策略颜色映射
 */
const STRATEGY_COLORS: Record<ProcessingStrategy, string> = {
  clip: 'bg-blue-100 text-blue-800 border-blue-200',
  watch_later: 'bg-purple-100 text-purple-800 border-purple-200',
  bookmark: 'bg-green-100 text-green-800 border-green-200',
  ignore: 'bg-gray-100 text-gray-600 border-gray-200'
}

/**
 * 增强URL输入组件
 */
export function EnhancedUrlInput({
  initialUrl = '',
  placeholder = '输入URL或粘贴链接...',
  disabled = false,
  autoDetect = true,
  detectionDelay = 500,
  onDetectionComplete,
  onUrlChange,
  onSubmit,
  className = '',
  showPlatformIcon = true,
  showContentType = true,
  showStrategy = true
}: EnhancedUrlInputProps) {
  const [url, setUrl] = useState(initialUrl)
  const [detectionResult, setDetectionResult] = useState<PlatformDetectionResult | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectionError, setDetectionError] = useState<string | null>(null)
  const [isValidUrl, setIsValidUrl] = useState(false)

  const detectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastDetectionUrlRef = useRef<string>('')

  /**
   * 验证URL格式
   */
  const validateUrl = useCallback((url: string): boolean => {
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }, [])

  /**
   * 检测URL平台
   */
  const detectUrlPlatform = useCallback(async (url: string) => {
    if (!validateUrl(url)) {
      setDetectionResult(null)
      setDetectionError(null)
      setIsValidUrl(false)
      return
    }

    // 避免重复检测相同的URL
    if (lastDetectionUrlRef.current === url && detectionResult?.platform !== 'generic') {
      return
    }

    setIsDetecting(true)
    setDetectionError(null)
    lastDetectionUrlRef.current = url

    try {
      const result = await detectPlatform(url)
      setDetectionResult(result)
      setDetectionError(result.error || null)
      onDetectionComplete?.(result)
    } catch (error) {
      console.error('平台检测失败:', error)
      setDetectionError(error instanceof Error ? error.message : '检测失败')
      setDetectionResult(null)
    } finally {
      setIsDetecting(false)
    }
  }, [validateUrl, detectionResult, onDetectionComplete])

  /**
   * 处理URL变化
   */
  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value.trim()
    setUrl(newUrl)
    onUrlChange?.(newUrl)

    const isValid = validateUrl(newUrl)
    setIsValidUrl(isValid)

    // 清除之前的检测定时器
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current)
    }

    // 如果URL有效且启用了自动检测，设置新的检测定时器
    if (isValid && autoDetect) {
      const timeoutId = setTimeout(() => {
        detectUrlPlatform(newUrl)
      }, detectionDelay)
      detectionTimeoutRef.current = timeoutId
    } else {
      setDetectionResult(null)
      setDetectionError(null)
    }
  }, [autoDetect, detectionDelay, detectUrlPlatform, onUrlChange, validateUrl])

  /**
   * 处理表单提交
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()

    if (!isValidUrl) {
      return
    }

    // 如果还没有检测结果，先检测
    if (!detectionResult && autoDetect) {
      detectUrlPlatform(url).then(() => {
        onSubmit?.(url, detectionResult || undefined)
      })
    } else {
      onSubmit?.(url, detectionResult || undefined)
    }
  }, [url, isValidUrl, detectionResult, autoDetect, detectUrlPlatform, onSubmit])

  /**
   * 手动触发检测
   */
  const handleManualDetect = useCallback(() => {
    if (isValidUrl) {
      detectUrlPlatform(url)
    }
  }, [url, isValidUrl, detectUrlPlatform])

  /**
   * 清除输入
   */
  const handleClear = useCallback(() => {
    setUrl('')
    setDetectionResult(null)
    setDetectionError(null)
    setIsValidUrl(false)
    onUrlChange?.('')

    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current)
    }
  }, [onUrlChange])

  /**
   * 组件卸载时清理
   */
  useEffect(() => {
    return () => {
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current)
      }
    }
  }, [])

  /**
   * 初始URL检测
   */
  useEffect(() => {
    if (initialUrl && validateUrl(initialUrl) && autoDetect) {
      detectUrlPlatform(initialUrl)
    }
  }, [initialUrl, autoDetect, validateUrl, detectUrlPlatform])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* URL输入表单 */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={url}
              onChange={handleUrlChange}
              placeholder={placeholder}
              disabled={disabled}
              className={`
                w-full px-4 py-3 rounded-lg border-2
                ${isValidUrl ? 'border-blue-300' : 'border-gray-300'}
                ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-all duration-200
              `}
            />

            {/* 清除按钮 */}
            {url && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="清除"
              >
                ✕
              </button>
            )}
          </div>

          {/* 手动检测按钮 */}
          {isValidUrl && autoDetect && (
            <button
              type="button"
              onClick={handleManualDetect}
              disabled={isDetecting || disabled}
              className={`
                px-4 py-3 rounded-lg border-2 font-medium
                ${isDetecting ? 'bg-gray-100 text-gray-600 border-gray-300' : 'bg-blue-50 text-blue-700 border-blue-200'}
                hover:bg-blue-100 hover:border-blue-300
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-200
              `}
            >
              {isDetecting ? '检测中...' : '检测'}
            </button>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={!isValidUrl || disabled}
            className={`
              px-6 py-3 rounded-lg font-medium
              ${isValidUrl ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200
            `}
          >
            处理
          </button>
        </div>

        {/* URL验证提示 */}
        {url && !isValidUrl && (
          <p className="text-sm text-red-600">
            请输入有效的URL（以 http:// 或 https:// 开头）
          </p>
        )}
      </form>

      {/* 检测结果展示 */}
      {(detectionResult || detectionError || isDetecting) && (
        <div className={`
          p-4 rounded-lg border-2
          ${detectionError ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}
          transition-all duration-200
        `}>
          {/* 检测状态 */}
          {isDetecting && (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>正在检测平台...</span>
            </div>
          )}

          {/* 检测错误 */}
          {detectionError && !isDetecting && (
            <div className="text-red-600">
              <p className="font-medium">检测失败</p>
              <p className="text-sm mt-1">{detectionError}</p>
            </div>
          )}

          {/* 检测结果 */}
          {detectionResult && !isDetecting && (
            <div className="space-y-3">
              {/* 平台信息 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {showPlatformIcon && (
                    <span className="text-2xl">
                      {PLATFORM_ICONS[detectionResult.platform]}
                    </span>
                  )}

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${PLATFORM_COLORS[detectionResult.platform]}`}>
                        {detectionResult.platform}
                      </span>

                      {showContentType && detectionResult.contentType !== 'generic' && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                          {CONTENT_TYPE_LABELS[detectionResult.contentType]}
                        </span>
                      )}

                      {showStrategy && detectionResult.processingStrategy && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${STRATEGY_COLORS[detectionResult.processingStrategy]}`}>
                          {STRATEGY_LABELS[detectionResult.processingStrategy]}
                        </span>
                      )}
                    </div>

                    {detectionResult.metadata?.title && (
                      <p className="text-sm font-medium mt-1 line-clamp-1">
                        {detectionResult.metadata.title}
                      </p>
                    )}
                  </div>
                </div>

                {/* 置信度 */}
                <div className="text-right">
                  <div className="text-xs text-gray-500">置信度</div>
                  <div className="text-sm font-medium">
                    {(detectionResult.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* 元数据详情 */}
              {detectionResult.metadata && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {detectionResult.metadata.author && (
                    <div>
                      <span className="text-gray-500">作者：</span>
                      <span>{detectionResult.metadata.author}</span>
                    </div>
                  )}

                  {detectionResult.metadata.duration && (
                    <div>
                      <span className="text-gray-500">时长：</span>
                      <span>
                        {Math.floor(detectionResult.metadata.duration / 60)}:
                        {(detectionResult.metadata.duration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  )}

                  {detectionResult.metadata.publishedAt && (
                    <div>
                      <span className="text-gray-500">发布时间：</span>
                      <span>{new Date(detectionResult.metadata.publishedAt).toLocaleDateString()}</span>
                    </div>
                  )}

                  {detectionResult.metadata.viewCount && (
                    <div>
                      <span className="text-gray-500">观看：</span>
                      <span>
                        {detectionResult.metadata.viewCount >= 10000
                          ? `${(detectionResult.metadata.viewCount / 10000).toFixed(1)}万`
                          : detectionResult.metadata.viewCount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 处理建议 */}
              {detectionResult.processingStrategy && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    建议处理方式：<span className="font-medium">{STRATEGY_LABELS[detectionResult.processingStrategy]}</span>
                    {detectionResult.processingStrategy === 'clip' && '（剪藏为文章）'}
                    {detectionResult.processingStrategy === 'watch_later' && '（添加到稍后观看）'}
                    {detectionResult.processingStrategy === 'bookmark' && '（保存为书签）'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 使用说明 */}
      <div className="text-sm text-gray-500 space-y-1">
        <p>支持的平台：YouTube、B站、Twitter、Medium、知乎、GitHub、微博等</p>
        <p>自动识别内容类型并推荐处理方式</p>
      </div>
    </div>
  )
}

/**
 * 平台图标组件
 */
export function PlatformIcon({ platform, size = 'md' }: { platform: PlatformType; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  }

  return (
    <span className={sizeClasses[size]} title={platform}>
      {PLATFORM_ICONS[platform]}
    </span>
  )
}

/**
 * 平台标签组件
 */
export function PlatformTag({ platform }: { platform: PlatformType }) {
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${PLATFORM_COLORS[platform]}`}>
      {platform}
    </span>
  )
}

/**
 * 内容类型标签组件
 */
export function ContentTypeTag({ contentType }: { contentType: ContentType }) {
  return (
    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
      {CONTENT_TYPE_LABELS[contentType]}
    </span>
  )
}

/**
 * 处理策略标签组件
 */
export function StrategyTag({ strategy }: { strategy: ProcessingStrategy }) {
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${STRATEGY_COLORS[strategy]}`}>
      {STRATEGY_LABELS[strategy]}
    </span>
  )
}