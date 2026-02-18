import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

// 字体配置
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
})

// 应用元数据
export const metadata: Metadata = {
  title: {
    default: '归藏 - 文章剪藏与知识管理',
    template: '%s | 归藏',
  },
  description:
    '一个隐私安全、离线优先的文章剪藏与知识管理工具，支持将网页文章转换为Markdown格式保存，并提供标签分类、全文搜索、离线访问等核心功能。',
  keywords: ['文章剪藏', '知识管理', 'Markdown', '离线应用', 'PWA', '网页抓取'],
  authors: [{ name: '归藏团队' }],
  creator: '归藏团队',
  publisher: '归藏团队',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://guizhang.app',
    title: '归藏 - 文章剪藏与知识管理',
    description: '一个隐私安全、离线优先的文章剪藏与知识管理工具',
    siteName: '归藏',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '归藏 - 文章剪藏与知识管理',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '归藏 - 文章剪藏与知识管理',
    description: '一个隐私安全、离线优先的文章剪藏与知识管理工具',
    images: ['/og-image.png'],
    creator: '@guizhang',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#3b82f6',
      },
    ],
  },
  manifest: '/manifest.json',
  verification: {
    google: 'google-site-verification-code',
    yandex: 'yandex-verification-code',
    yahoo: 'yahoo-verification-code',
  },
}

// 视口配置
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  colorScheme: 'light dark',
}

// PWA 相关配置
export const runtime = 'edge'
export const preferredRegion = 'auto'

// 根布局组件
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-CN"
      className={cn(inter.variable, 'scroll-smooth antialiased', 'bg-background text-foreground')}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Noto+Sans+SC:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        {/* 主体内容 */}
        <div className="relative flex min-h-screen flex-col">
          {/* 顶部导航（暂留位置） */}
          <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary" />
                <span className="text-xl font-bold">归藏</span>
              </div>
              <nav className="hidden md:flex items-center gap-6">
                <a href="/" className="text-sm font-medium hover:text-primary transition-colors">
                  首页
                </a>
                <a
                  href="/clipper"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  剪藏
                </a>
                <a
                  href="/articles"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  文章
                </a>
                <a
                  href="/tags"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  标签
                </a>
                <a
                  href="/settings"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  设置
                </a>
              </nav>
              <div className="flex items-center gap-4">
                <button className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary-hover transition-colors">
                  开始剪藏
                </button>
              </div>
            </div>
          </header>

          {/* 主内容区域 */}
          <main className="flex-1">{children}</main>

          {/* 底部信息 */}
          <footer className="border-t border-border bg-muted/50">
            <div className="container mx-auto px-4 py-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-primary" />
                    <span className="font-bold">归藏</span>
                  </div>
                  <p className="text-sm text-foreground-muted">
                    一个隐私安全、离线优先的文章剪藏与知识管理工具。
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">产品</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <a href="/features" className="hover:text-primary transition-colors">
                        功能
                      </a>
                    </li>
                    <li>
                      <a href="/pricing" className="hover:text-primary transition-colors">
                        定价
                      </a>
                    </li>
                    <li>
                      <a href="/roadmap" className="hover:text-primary transition-colors">
                        路线图
                      </a>
                    </li>
                    <li>
                      <a href="/changelog" className="hover:text-primary transition-colors">
                        更新日志
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">支持</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <a href="/help" className="hover:text-primary transition-colors">
                        帮助中心
                      </a>
                    </li>
                    <li>
                      <a href="/docs" className="hover:text-primary transition-colors">
                        文档
                      </a>
                    </li>
                    <li>
                      <a href="/contact" className="hover:text-primary transition-colors">
                        联系我们
                      </a>
                    </li>
                    <li>
                      <a href="/status" className="hover:text-primary transition-colors">
                        系统状态
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">法律</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <a href="/privacy" className="hover:text-primary transition-colors">
                        隐私政策
                      </a>
                    </li>
                    <li>
                      <a href="/terms" className="hover:text-primary transition-colors">
                        服务条款
                      </a>
                    </li>
                    <li>
                      <a href="/cookies" className="hover:text-primary transition-colors">
                        Cookie政策
                      </a>
                    </li>
                    <li>
                      <a href="/security" className="hover:text-primary transition-colors">
                        安全
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-border text-center text-sm text-foreground-subtle">
                <p>© {new Date().getFullYear()} 归藏. 保留所有权利.</p>
              </div>
            </div>
          </footer>
        </div>

        {/* 分析工具（待安装@vercel/analytics和@vercel/speed-insights后启用） */}
        {/* {process.env.NODE_ENV === 'production' && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )} */}

        {/* PWA 安装提示（暂留位置） */}
        <div id="pwa-install-prompt" className="hidden" />
      </body>
    </html>
  )
}
