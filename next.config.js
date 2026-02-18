/** @type {import('next').NextConfig} */
const nextConfig = {
  /* 基础配置 */
  reactStrictMode: true,
  poweredByHeader: false,
  generateEtags: true,

  /* 图片优化配置 */
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  /* 环境变量 */
  env: {
    APP_NAME: '归藏',
    APP_VERSION: '1.0.0',
  },

  /* 头部配置 */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },

  /* 重写和重定向 */
  async rewrites() {
    return []
  },

  async redirects() {
    return []
  },

  /* 编译配置 */
  compiler: {
    // 移除 console.log 在生产环境
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  /* 实验性功能 */
  experimental: {
    // 服务器操作
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // 优化包大小
    optimizeCss: true,
    // 预加载（Next.js 16.1.6不支持此选项，已移除）
  },
}

export default nextConfig
