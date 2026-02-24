/**
 * 平台检测功能演示页面
 */

'use client'

import React, { useState } from 'react'
import { EnhancedUrlInput } from '../../../components/enhanced-url-input'
import { PlatformDetectionResult } from '../../../types'

/**
 * 示例URL列表
 */
const EXAMPLE_URLS = [
  {
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    label: 'YouTube视频',
    description: 'Rick Astley - Never Gonna Give You Up'
  },
  {
    url: 'https://www.bilibili.com/video/BV1GJ411x7h7',
    label: 'B站视频',
    description: '【官方MV】李荣浩 - 麻雀'
  },
  {
    url: 'https://twitter.com/elonmusk/status/1234567890123456789',
    label: 'Twitter推文',
    description: 'Elon Musk的推文示例'
  },
  {
    url: 'https://medium.com/@example/how-to-build-a-web-app-1234567890ab',
    label: 'Medium文章',
    description: '如何构建Web应用'
  },
  {
    url: 'https://www.zhihu.com/question/123456789',
    label: '知乎问题',
    description: '有什么值得推荐的学习方法？'
  },
  {
    url: 'https://github.com/vercel/next.js',
    label: 'GitHub仓库',
    description: 'Next.js官方仓库'
  },
  {
    url: 'https://weibo.com/1234567890/AbCdEfGhI',
    label: '微博',
    description: '微博内容示例'
  },
  {
    url: 'https://stackoverflow.com/questions/1234567/how-to-fix-error-in-javascript',
    label: 'Stack Overflow',
    description: 'JavaScript错误修复问题'
  }
]

/**
 * 平台检测演示页面
 */
export default function PlatformDetectorDemoPage() {
  const [detectionHistory, setDetectionHistory] = useState<Array<{
    url: string
    result: PlatformDetectionResult
    timestamp: string
  }>>([])

  /**
   * 处理URL提交
   */
  const handleUrlSubmit = (url: string, detectionResult?: PlatformDetectionResult) => {
    if (detectionResult) {
      const newEntry = {
        url,
        result: detectionResult,
        timestamp: new Date().toISOString()
      }

      setDetectionHistory(prev => [newEntry, ...prev.slice(0, 9)]) // 保留最近10条记录
    }

    console.log('提交URL:', url, detectionResult)
    alert(`已提交URL: ${url}\n处理策略: ${detectionResult?.processingStrategy || '未知'}`)
  }

  /**
   * 处理检测完成
   */
  const handleDetectionComplete = (result: PlatformDetectionResult) => {
    console.log('检测完成:', result)
  }

  /**
   * 处理示例URL点击
   */
  const handleExampleClick = (url: string) => {
    // 这里可以设置URL到输入框
    console.log('选择示例URL:', url)
    // 在实际应用中，你可能需要将URL传递给EnhancedUrlInput组件
  }

  /**
   * 清除历史记录
   */
  const clearHistory = () => {
    setDetectionHistory([])
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 页面标题 */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">平台检测功能演示</h1>
          <p className="text-gray-600 mt-2">
            自动识别URL的平台和内容类型，智能推荐处理策略
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：输入和示例 */}
          <div className="lg:col-span-2 space-y-8">
            {/* URL输入区域 */}
            <section className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">URL检测</h2>
              <EnhancedUrlInput
                placeholder="输入或粘贴URL链接..."
                autoDetect={true}
                detectionDelay={300}
                onDetectionComplete={handleDetectionComplete}
                onSubmit={handleUrlSubmit}
                showPlatformIcon={true}
                showContentType={true}
                showStrategy={true}
                className="w-full"
              />
            </section>

            {/* 示例URL */}
            <section className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">示例URL</h2>
                <span className="text-sm text-gray-500">点击使用示例</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {EXAMPLE_URLS.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example.url)}
                    className="text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200 group"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <span className="text-gray-600 group-hover:text-blue-600">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {example.label}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {example.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {example.url}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* 右侧：检测历史 */}
          <div className="space-y-8">
            {/* 检测历史 */}
            <section className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">检测历史</h2>
                {detectionHistory.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    清除
                  </button>
                )}
              </div>

              {detectionHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">暂无检测历史</div>
                  <p className="text-sm text-gray-500">
                    输入URL并检测后，历史记录将显示在这里
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {detectionHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            entry.result.platform === 'youtube' ? 'bg-red-100 text-red-800' :
                            entry.result.platform === 'bilibili' ? 'bg-pink-100 text-pink-800' :
                            entry.result.platform === 'twitter' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {entry.result.platform}
                          </span>
                          <span className="text-xs text-gray-500">
                            {(entry.result.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-sm font-medium text-gray-900 truncate mb-1">
                        {entry.result.metadata?.title || entry.url}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 truncate max-w-[70%]">
                          {entry.url}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          entry.result.processingStrategy === 'clip' ? 'bg-blue-100 text-blue-800' :
                          entry.result.processingStrategy === 'watch_later' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {entry.result.processingStrategy === 'clip' ? '剪藏' :
                           entry.result.processingStrategy === 'watch_later' ? '稍后观看' :
                           entry.result.processingStrategy === 'bookmark' ? '书签' : '未知'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 功能说明 */}
            <section className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">功能说明</h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-sm">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">自动平台检测</p>
                    <p className="text-sm text-gray-600">
                      支持YouTube、B站、Twitter、Medium、知乎、GitHub等主流平台
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-sm">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">内容类型识别</p>
                    <p className="text-sm text-gray-600">
                      自动识别文章、视频、推文、代码仓库等不同类型内容
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-sm">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">智能处理策略</p>
                    <p className="text-sm text-gray-600">
                      根据内容类型自动推荐剪藏、稍后观看或书签保存
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-sm">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">实时预览</p>
                    <p className="text-sm text-gray-600">
                      输入URL时实时检测并显示平台信息和元数据
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* API测试区域 */}
        <section className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">API测试</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-medium text-gray-700">平台检测API</h3>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                <div className="text-gray-600">POST /api/platform/detect</div>
                <div className="mt-2">
                  <span className="text-gray-500">{'{\n'}</span>
                  <div className="ml-4">
                    <span className="text-blue-600">"url"</span>
                    <span className="text-gray-500">: </span>
                    <span className="text-green-600">"https://example.com"</span>
                  </div>
                  <span className="text-gray-500">{'\n}'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-gray-700">增强剪藏API</h3>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                <div className="text-gray-600">POST /api/clipper</div>
                <div className="mt-2">
                  <span className="text-gray-500">{'{\n'}</span>
                  <div className="ml-4">
                    <div>
                      <span className="text-blue-600">"url"</span>
                      <span className="text-gray-500">: </span>
                      <span className="text-green-600">"https://example.com"</span>
                      <span className="text-gray-500">,</span>
                    </div>
                    <div>
                      <span className="text-blue-600">"strategy"</span>
                      <span className="text-gray-500">: </span>
                      <span className="text-green-600">"auto"</span>
                    </div>
                  </div>
                  <span className="text-gray-500">{'\n}'}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 页脚 */}
        <footer className="mt-8 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p>归藏 (Guizhang) - 文章剪藏与知识管理应用</p>
          <p className="mt-1">平台检测功能 v1.0.0</p>
        </footer>
      </div>
    </div>
  )
}