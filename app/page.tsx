import { ArrowRight, BookOpen, Download, Search, Shield, Zap } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// 功能特性列表
const features = [
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: '文章剪藏',
    description: '输入URL自动抓取网页内容，转换为干净的Markdown格式保存',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: '隐私安全',
    description: '数据完全本地存储，用户拥有完全控制权，无需担心隐私泄露',
    color: 'bg-success/10 text-success',
  },
  {
    icon: <Download className="h-6 w-6" />,
    title: '离线可用',
    description: '无需网络即可访问剪藏内容，随时随地管理个人知识库',
    color: 'bg-info/10 text-info',
  },
  {
    icon: <Search className="h-6 w-6" />,
    title: '全文搜索',
    description: '快速检索剪藏内容，支持关键词高亮和高级筛选',
    color: 'bg-accent/10 text-accent',
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: '多平台支持',
    description: '一套代码适配Web、PWA、iOS/Android App，数据无缝同步',
    color: 'bg-warning/10 text-warning',
  },
]

// 使用步骤
const steps = [
  {
    number: '01',
    title: '输入URL',
    description: '复制文章链接，粘贴到归藏中',
  },
  {
    number: '02',
    title: '自动抓取',
    description: '系统智能提取正文，去除广告和导航噪音',
  },
  {
    number: '03',
    title: '格式转换',
    description: 'HTML自动转换为易读的Markdown格式',
  },
  {
    number: '04',
    title: '保存管理',
    description: '添加标签分类，支持搜索和离线访问',
  },
]

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* 英雄区域 */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2 text-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span>隐私安全 · 离线优先 · 开源免费</span>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              专注
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                文章剪藏
              </span>
              与
              <span className="bg-gradient-to-r from-accent to-warning bg-clip-text text-transparent">
                知识管理
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-foreground-muted">
              归藏是一个现代化的文章剪藏与知识管理工具，支持将网页文章转换为Markdown格式保存，
              并提供标签分类、全文搜索、离线访问等核心功能。数据完全本地存储，用户拥有完全控制权。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/clipper"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
              >
                开始剪藏
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/articles"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-8 py-3 text-base font-medium hover:bg-muted transition-colors"
              >
                查看示例
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 功能特性 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">核心功能特性</h2>
            <p className="text-lg text-foreground-muted">
              归藏提供了现代化的文章剪藏与知识管理体验
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={cn(
                  'group rounded-xl border border-border bg-surface p-6',
                  'hover:border-primary/50 hover:shadow-lg transition-all'
                )}
              >
                <div
                  className={cn(
                    'mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg',
                    feature.color
                  )}
                >
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-foreground-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 使用步骤 */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">简单四步，轻松剪藏</h2>
            <p className="text-lg text-foreground-muted">无需复杂操作，快速收藏和管理网络文章</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="absolute -left-4 top-0 -z-10 h-full w-px bg-border md:hidden" />
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  {step.number}
                </div>
                <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
                <p className="text-foreground-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 技术栈展示 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">现代化技术栈</h2>
            <p className="text-lg text-foreground-muted">
              采用业界领先的技术方案，确保应用的性能和稳定性
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Next.js 15', desc: 'React全栈框架' },
              { name: 'TypeScript', desc: '类型安全开发' },
              { name: 'Tailwind CSS', desc: '原子化CSS' },
              { name: 'IndexedDB', desc: '本地数据库' },
              { name: 'PWA', desc: '渐进式Web应用' },
              { name: 'React Query', desc: '数据状态管理' },
              { name: 'Zustand', desc: '全局状态管理' },
              { name: 'Dexie.js', desc: 'IndexedDB封装' },
            ].map((tech, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-surface p-4 text-center hover:border-primary/50 transition-colors"
              >
                <div className="font-semibold">{tech.name}</div>
                <div className="text-sm text-foreground-muted">{tech.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA区域 */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-3xl font-bold">立即开始构建你的知识库</h2>
            <p className="mb-8 text-lg text-foreground-muted">
              无需注册，无需付费，立即开始使用归藏管理你的知识资产
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/clipper"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
              >
                免费开始使用
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-8 py-3 text-base font-medium hover:bg-muted transition-colors"
              >
                查看文档
              </Link>
            </div>
            <p className="mt-6 text-sm text-foreground-subtle">
              完全开源 · 数据本地存储 · 无需网络 · 隐私安全
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
