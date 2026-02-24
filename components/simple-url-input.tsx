/**
 * 简化版URL输入组件
 */

'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { simpleDetect } from '../lib/platform-detector/simple'

/**
 * 组件属性
 */
interface SimpleUrlInputProps {
  initialUrl?: string
  placeholder?: string
  disabled?: boolean
  autoDetect?: boolean
  detectionDelay?: number
  onSubmit?: (url: string) => void
  className?: string
}

/**
 * 平台颜色映射
 */
const PLATFORM_COLORS: Record<string, string> = {
  youtube: 'bg-red-100 text-red-800',
  bilibili: 'bg-pink-100 text-pink-800',
  twitter: 'bg-blue-100 text-blue-800',
  medium: 'bg-green-100 text-green-800',
  zhihu: 'bg-blue-50 text-blue-700',
  github: 'bg-gray-100 text-gray-800',
  generic: 'bg-gray-100 text-gray-600'
}

/**
 * 内容类型标签
 */
const CONTENT_TYPE_LABELS: Record<string, string> = {
  article: '文章',
  video: '视频',
  tweet: '推文',
  code_repository: '代码仓库',
  documentation: '文档',
  discussion: '讨论',
  generic: '通用'
}

/**
 * 处理策略标签
 */
const STRATEGY_LABELS: Record<string, string> = {
  clip: '剪藏',
  watch_later: '稍后观看',
  bookmark: '书签'
}

/**
 * 简化URL输入组件
 */
export function SimpleUrlInput({
  initialUrl = '',
  placeholder = '输入URL或粘贴链接...',
  disabled = false,
  autoDetect = true,
  detectionDelay = 500,
  onSubmit,
  className = ''
}: SimpleUrlInputProps) {
  const [url, setUrl] = useState(initialUrl)
  const [detectionResult, setDetectionResult] = useState<any>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [isValidUrl, setIsValidUrl] = useState(false)

  const detectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      setIsValidUrl(false)
      return
    }

    setIsDetecting(true)

    try {
      const result = await simpleDetect(url)
      setDetectionResult(result)
    } catch (error) {
      console.error('平台检测失败:', error)
      setDetectionResult(null)
    } finally {
      setIsDetecting(false)
    }
  }, [validateUrl])

  /**
   * 处理URL变化
   */
  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value.trim()
    setUrl(newUrl)

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
    }
  }, [autoDetect, detectionDelay, detectUrlPlatform, validateUrl])

  /**
   * 处理表单提交
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()

    if (!isValidUrl) {
      return
    }

    onSubmit?.(url)
  }, [url, isValidUrl, onSubmit])

  /**
   * 清除输入
   */
  const handleClear = useCallback(() => {
    setUrl('')
    setDetectionResult(null)
    setIsValidUrl(false)

    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current)
    }
  }, [])

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
      {(detectionResult || isDetecting) && (
        <div className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
          {/* 检测状态 */}
          {isDetecting && (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>正在检测平台...</span>
            </div>
          )}

          {/* 检测结果 */}
          {detectionResult && !isDetecting && (
            <div className="space-y-3">
              {/* 平台信息 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${PLATFORM_COLORS[detectionResult.platform] || 'bg-gray-100 text-gray-700'}`}>
                        {detectionResult.platform}
                      </span>

                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {CONTENT_TYPE_LABELS[detectionResult.contentType] || '未知'}
                      </span>

                      {detectionResult.processingStrategy && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {STRATEGY_LABELS[detectionResult.processingStrategy] || '未知'}
                        </span>
                      )}
                    </div>
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

              {/* 处理建议 */}
              {detectionResult.processingStrategy && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    建议处理方式：<span className="font-medium">{STRATEGY_LABELS[detectionResult.processingStrategy]}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 使用说明 */}
      <div className="text-sm text-gray-500 space-y-1">
        <p>支持的平台：YouTube、B站、Twitter、Medium、知乎、GitHub等</p>
        <p>自动识别内容类型并推荐处理方式</p>
      </div>
    </div>
  )
}