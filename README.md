# 归藏 (Guizhang) - 文章剪藏与知识管理应用

## 项目介绍

归藏是一个现代化的文章剪藏与知识管理 Web 应用，支持将网页文章转换为 Markdown 格式保存，并提供标签分类、全文搜索、离线访问等核心功能。应用采用 Next.js 全栈架构，支持自有服务器部署。

## 功能特性

### 核心功能
- **文章剪藏**：输入文章 URL，自动抓取并解析网页内容
- **内容转换**：将 HTML 转换为干净的 Markdown 格式
- **本地存储**：使用本地数据库存储剪藏内容，支持离线访问
- **标签系统**：灵活的标签和分类管理
- **全文搜索**：快速检索剪藏内容，支持关键词高亮

### 高级功能
- **自动同步**：定期检查 URL 更新，同步最新内容
- **PWA 支持**：可安装为桌面应用，原生体验
- **数据导出**：支持 Markdown、JSON 等多种格式导出
- **浏览器扩展**（规划中）：一键剪藏当前网页

### 用户体验
- **响应式设计**：适配桌面、平板、手机等多种设备
- **暗色模式**：支持自动切换主题
- **快捷键操作**：提高操作效率
- **批量操作**：支持批量导入、导出、删除

## 技术栈

### 前端
- **框架**：Next.js 15 (App Router) + TypeScript
- **UI 组件**：Tailwind CSS + shadcn/ui
- **状态管理**：Zustand
- **离线存储**：Dexie.js (IndexedDB)
- **全文搜索**：Fuse.js
- **富文本编辑器**：TipTap
- **PWA**：next-pwa

### 后端
- **运行时**：Node.js (Next.js API Routes)
- **网页抓取**：Playwright (支持动态页面)
- **内容解析**：Readability.js + turndown (HTML to Markdown)
- **数据库**：SQLite (开发) / PostgreSQL (生产)
- **ORM**：Prisma
- **任务队列**：Bull (Redis)

### 开发工具
- **包管理**：npm
- **代码质量**：TypeScript、ESLint、Prettier
- **测试框架**：Vitest + React Testing Library + Playwright
- **容器化**：Docker + Docker Compose
- **CI/CD**：GitHub Actions

## 项目结构

```
guizhang/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── articles/      # 文章相关接口
│   │   ├── tags/          # 标签管理接口
│   │   └── clipper/       # 剪藏服务接口
│   ├── (dashboard)/       # 仪表板页面
│   ├── (auth)/            # 认证页面（预留）
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # 可复用组件
│   ├── ui/               # shadcn/ui 组件
│   ├── articles/         # 文章相关组件
│   └── layout/           # 布局组件
├── lib/                  # 工具函数和配置
│   ├── db/              # 数据库客户端
│   ├── clipper/          # 剪藏核心逻辑
│   ├── search/           # 搜索服务
│   └── utils/           # 通用工具
├── public/               # 静态资源
├── prisma/               # Prisma 模型和迁移
├── docs/                 # 项目文档
└── tests/                # 测试文件
```

## 快速开始

### 环境要求
- Node.js 18.17.0 或更高版本
- npm 9.x 或更高版本
- 支持 SQLite 或 PostgreSQL 数据库

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/yourusername/guizhang.git
   cd guizhang
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **环境配置**
   复制环境变量示例文件：
   ```bash
   cp .env.example .env.local
   ```
   编辑 `.env.local` 文件，配置数据库连接等参数。

4. **数据库初始化**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **启动开发服务器**
   ```bash
   npm run dev
   ```
   访问 http://localhost:3000

### 开发命令
- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run start` - 启动生产服务器
- `npm run lint` - 代码检查
- `npm run test` - 运行测试
- `npm run db:studio` - 打开 Prisma Studio

## 配置说明

### 环境变量
```
# 数据库配置
DATABASE_URL="file:./dev.db"  # SQLite 开发环境
# DATABASE_URL="postgresql://user:password@localhost:5432/guizhang"  # PostgreSQL 生产环境

# 应用配置
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# 剪藏服务配置
CLIPPER_TIMEOUT=30000  # 抓取超时时间（毫秒）
CLIPPER_USER_AGENT="Mozilla/5.0 Guizhang-Clipper/1.0"  # 用户代理

# 安全配置
JWT_SECRET="your-jwt-secret-key"  # JWT 密钥（预留）
```

### 浏览器扩展配置
如需使用浏览器扩展，需要配置 Chrome 扩展 Manifest V3，具体配置见 `extension/` 目录。

## API 接口设计

### 文章管理
- `GET /api/articles` - 获取文章列表（支持分页、筛选、排序）
- `GET /api/articles/:id` - 获取文章详情
- `POST /api/articles` - 创建新文章（通过 URL）
- `PUT /api/articles/:id` - 更新文章
- `DELETE /api/articles/:id` - 删除文章
- `POST /api/articles/:id/sync` - 同步文章内容

### 剪藏服务
- `POST /api/clipper/fetch` - 抓取网页内容
- `POST /api/clipper/parse` - 解析网页为 Markdown
- `GET /api/clipper/status` - 获取剪藏服务状态

### 标签管理
- `GET /api/tags` - 获取所有标签
- `POST /api/tags` - 创建标签
- `PUT /api/tags/:id` - 更新标签
- `DELETE /api/tags/:id` - 删除标签

### 搜索服务
- `GET /api/search` - 全文搜索文章
- `GET /api/search/suggest` - 搜索建议

## 数据库设计

### 核心表结构

#### 文章表 (articles)
```sql
id          String   @id @default(cuid())
url         String   @unique
title       String
content     String?  # Markdown 格式
html        String?  # 原始 HTML（可选）
excerpt     String?  # 摘要
cover_image String?  # 封面图片
author      String?  # 作者
source      String?  # 来源网站
language    String?  # 语言
word_count  Int      # 字数统计
reading_time Int     # 阅读时间（分钟）
is_starred  Boolean  @default(false)  # 是否星标
is_archived Boolean  @default(false)  # 是否归档
status      String   @default("active")  # 状态：active, deleted, error
error_msg   String?  # 错误信息
clipped_at  DateTime @default(now())  # 剪藏时间
updated_at  DateTime @updatedAt
created_at  DateTime @default(now())
```

#### 标签表 (tags)
```sql
id          String   @id @default(cuid())
name        String   @unique
color       String?  # 标签颜色
description String?  # 描述
created_at  DateTime @default(now())
```

#### 文章标签关联表 (article_tags)
```sql
id         String   @id @default(cuid())
article_id String   @db.ObjectId
tag_id     String   @db.ObjectId
created_at DateTime @default(now())

@@unique([article_id, tag_id])
```

#### 同步记录表 (sync_logs)
```sql
id          String   @id @default(cuid())
article_id  String   @db.ObjectId
status      String   # success, failed, no_change
change_type String?  # content_updated, metadata_updated
message     String?  # 同步信息
synced_at   DateTime @default(now())
```

## 部署指南

### 使用 Docker 部署（推荐）

1. **构建 Docker 镜像**
   ```bash
   docker build -t guizhang .
   ```

2. **使用 Docker Compose 运行**
   ```bash
   docker-compose up -d
   ```

3. **环境变量配置**
   创建 `docker-compose.yml` 和 `.env` 文件，配置数据库连接等。

### 传统服务器部署

1. **安装依赖**
   ```bash
   npm ci --only=production
   ```

2. **构建应用**
   ```bash
   npm run build
   ```

3. **使用 PM2 进程管理**
   ```bash
   npm install -g pm2
   pm2 start npm --name "guizhang" -- start
   pm2 save
   pm2 startup
   ```

### 反向代理配置（Nginx）
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 开发计划

### Phase 1: MVP（2-3周）
- [ ] 基础 Next.js 项目搭建
- [ ] 数据库模型设计
- [ ] 网页抓取和解析核心功能
- [ ] 文章列表和详情页面
- [ ] 基本的标签管理

### Phase 2: 核心功能（3-4周）
- [ ] 全文搜索实现
- [ ] 离线存储支持
- [ ] PWA 配置和安装
- [ ] 响应式设计和 UI 优化
- [ ] 批量操作功能

### Phase 3: 高级功能（4-6周）
- [ ] 自动同步服务
- [ ] 浏览器扩展开发
- [ ] 数据导入导出
- [ ] 用户系统（预留）
- [ ] API 文档和 SDK

### Phase 4: 优化和部署（2-3周）
- [ ] 性能优化
- [ ] 安全加固
- [ ] 测试覆盖
- [ ] 部署脚本和文档
- [ ] 监控和日志

## 贡献指南

欢迎提交 Issue 和 Pull Request。在提交代码前，请确保：
1. 代码通过 ESLint 检查
2. 添加相应的测试用例
3. 更新相关文档

## 许可证

MIT License

## 联系

- 项目主页：https://github.com/yourusername/guizhang
- 问题反馈：https://github.com/yourusername/guizhang/issues

---

*归藏之名，取自《周易》"归藏易"，寓意知识的收集与整理。*
