# 架构设计文档

## 系统架构概述

归藏采用现代全栈 Web 应用架构，基于 Next.js 15 的 App Router 实现前后端一体化开发。系统设计遵循以下原则：

1. **前后端分离**：前端 React + 后端 API Routes，清晰职责划分
2. **离线优先**：支持 PWA 和 IndexedDB，提供离线访问能力
3. **渐进增强**：基础功能可用，高级功能按需加载
4. **性能优先**：服务端渲染、静态生成、缓存策略优化
5. **可扩展性**：模块化设计，支持功能插件化扩展

## 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         客户端层                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │
│  │  浏览器    │  │   PWA      │  │  浏览器扩展        │  │
│  │            │  │            │  │  (Chrome/Firefox)  │  │
│  └────────────┘  └────────────┘  └────────────────────┘  │
│         │               │                    │            │
│         └───────────────┼────────────────────┘            │
│                         ▼                                  │
│              ┌─────────────────────┐                     │
│              │     前端应用         │                     │
│              │  (Next.js App)      │                     │
│              └─────────────────────┘                     │
│                         │                                  │
│         ┌───────────────┼─────────────────────┐           │
│         ▼               ▼                     ▼           │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │
│  │ IndexedDB  │  │ Service    │  │   API 请求         │  │
│  │  离线存储  │  │ Worker     │  │   (REST/GraphQL)   │  │
│  └────────────┘  └────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────┐
│                        服务端层                              │
│              ┌─────────────────────┐                     │
│              │   Next.js 服务器     │                     │
│              │  (Node.js Runtime)  │                     │
│              └─────────────────────┘                     │
│                         │                                  │
│         ┌───────────────┼─────────────────────┐           │
│         ▼               ▼                     ▼           │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │
│  │  API路由   │  │  渲染引擎   │  │   静态文件服务     │  │
│  │  (App Router)│  │ (React SSR)  │  │   (Public Assets) │  │
│  └────────────┘  └────────────┘  └────────────────────┘  │
│         │                                                  │
│         ▼                                                  │
│  ┌────────────────────────────────────────────┐           │
│  │             业务逻辑层                       │           │
│  │  ┌────────────┐  ┌────────────────────┐  │           │
│  │  │  剪藏服务   │  │   搜索服务         │  │           │
│  │  │ (Clipper)  │  │   (Search)        │  │           │
│  │  └────────────┘  └────────────────────┘  │           │
│  │  ┌────────────┐  ┌────────────────────┐  │           │
│  │  │  标签服务   │  │   同步服务         │  │           │
│  │  │  (Tags)    │  │   (Sync)          │  │           │
│  │  └────────────┘  └────────────────────┘  │           │
│  └────────────────────────────────────────────┘           │
│         │                                                  │
│         ▼                                                  │
│  ┌────────────────────────────────────────────┐           │
│  │             数据访问层                       │           │
│  │  ┌────────────┐  ┌────────────────────┐  │           │
│  │  │  Prisma    │  │   Redis 客户端      │  │           │
│  │  │  (ORM)     │  │   (缓存/队列)       │  │           │
│  │  └────────────┘  └────────────────────┘  │           │
│  └────────────────────────────────────────────┘           │
│         │                                                  │
│         ▼                                                  │
│  ┌────────────────────────────────────────────┐           │
│  │             数据存储层                       │           │
│  │  ┌────────────┐  ┌────────────────────┐  │           │
│  │  │ PostgreSQL │  │      Redis         │  │           │
│  │  │   (主库)   │  │   (缓存/会话)       │  │           │
│  │  └────────────┘  └────────────────────┘  │           │
│  │  ┌────────────┐                           │           │
│  │  │   SQLite   │                           │           │
│  │  │  (开发环境) │                           │           │
│  │  └────────────┘                           │           │
│  └────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## 前端架构

### 技术栈选择
- **Next.js 15 (App Router)**：全栈框架，服务端渲染，文件系统路由
- **React 19**：UI 库，支持并发特性
- **TypeScript**：类型安全，提高开发效率
- **Tailwind CSS**：原子化 CSS，快速 UI 开发
- **shadcn/ui**：现代组件库，可定制性强
- **Zustand**：轻量级状态管理
- **TanStack Query**：数据获取和缓存
- **Dexie.js**：IndexedDB 封装，离线存储
- **Fuse.js**：客户端全文搜索

### 项目结构
```
app/
├── (auth)/                    # 认证相关页面（预留）
│   ├── login/
│   └── register/
├── (dashboard)/              # 仪表板相关页面
│   ├── articles/            # 文章管理
│   ├── tags/                # 标签管理
│   ├── settings/            # 设置页面
│   └── layout.tsx           # 仪表板布局
├── api/                      # API 路由
│   ├── articles/
│   ├── tags/
│   ├── clipper/
│   ├── search/
│   └── sync/
├── lib/                      # 前端工具库
│   ├── db/                  # IndexedDB 封装
│   ├── api/                 # API 客户端
│   ├── clipper/             # 剪藏工具
│   └── search/              # 搜索工具
├── components/               # 可复用组件
│   ├── ui/                  # 基础 UI 组件
│   ├── articles/            # 文章相关组件
│   ├── tags/                # 标签相关组件
│   └── layout/              # 布局组件
├── hooks/                    # 自定义 Hooks
├── styles/                   # 全局样式
├── layout.tsx               # 根布局
└── page.tsx                 # 首页
```

### 状态管理策略

#### 全局状态（Zustand）
- 用户偏好设置（主题、语言、布局）
- 应用配置信息
- 全局通知和加载状态

#### 服务器状态（TanStack Query）
- 文章列表和详情
- 标签数据
- 搜索结果
- 同步状态

#### 本地状态（React State）
- 表单输入
- UI 交互状态
- 组件内部状态

#### 离线状态（IndexedDB）
- 文章缓存
- 标签缓存
- 搜索索引

### 离线存储设计

#### IndexedDB 架构
```typescript
// 数据库模式设计
interface DatabaseSchema {
  // 文章表
  articles: {
    id: string;
    url: string;
    title: string;
    content: string; // Markdown
    excerpt?: string;
    cover_image?: string;
    author?: string;
    source?: string;
    language?: string;
    word_count: number;
    reading_time: number;
    tags: string[]; // 标签ID数组
    is_starred: boolean;
    is_archived: boolean;
    clipped_at: Date;
    updated_at: Date;
    created_at: Date;
  };

  // 标签表
  tags: {
    id: string;
    name: string;
    color?: string;
    description?: string;
    created_at: Date;
  };

  // 同步队列
  syncQueue: {
    id: string;
    type: 'create' | 'update' | 'delete';
    entity: 'article' | 'tag';
    entityId: string;
    payload: any;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    retryCount: number;
    created_at: Date;
  };
}
```

#### 同步策略
1. **离线优先**：操作先在本地 IndexedDB 执行
2. **队列同步**：网络恢复后，按顺序同步到服务器
3. **冲突解决**：时间戳优先，最后写入获胜（LWW）
4. **增量同步**：仅同步变更数据

### PWA 特性
- **Service Worker**：缓存关键资源，支持离线访问
- **Web App Manifest**：定义应用元数据，支持安装到桌面
- **Background Sync**：后台数据同步
- **Push Notifications**：新内容提醒（预留）

## 后端架构

### API 设计原则
1. **RESTful 风格**：资源导向，HTTP 方法语义化
2. **版本管理**：API 版本化，支持平滑升级
3. **错误处理**：统一错误响应格式
4. **速率限制**：防止滥用，保护服务
5. **认证授权**：JWT Token，角色权限控制（预留）

### 剪藏服务架构

#### 核心流程
```
1. 接收 URL → 2. 验证 URL → 3. 检查缓存 → 4. 抓取网页
    ↓
5. 解析内容 → 6. 提取元数据 → 7. 转换 Markdown → 8. 存储数据库
```

#### 组件设计
```typescript
interface ClipperService {
  // 网页抓取器
  fetcher: {
    fetch(url: string, options?: FetchOptions): Promise<FetchResult>;
    fetchWithPlaywright(url: string): Promise<FetchResult>;
  };

  // 内容解析器
  parser: {
    parse(html: string, url: string): Promise<ParseResult>;
    extractMetadata(html: string, url: string): Promise<Metadata>;
    extractContent(html: string): Promise<Content>;
  };

  // 格式转换器
  converter: {
    htmlToMarkdown(html: string): Promise<string>;
    cleanupMarkdown(markdown: string): Promise<string>;
  };

  // 缓存管理器
  cache: {
    get(url: string): Promise<CachedResult | null>;
    set(url: string, result: CachedResult, ttl: number): Promise<void>;
  };
}
```

#### 支持的网站类型
1. **静态网站**：直接 HTML 解析
2. **动态网站**：Playwright 渲染后解析
3. **社交媒体**：特定平台 API（预留）
4. **新闻媒体**：适配常见新闻网站模板
5. **技术博客**：适配常见博客平台

### 搜索服务架构

#### 搜索流程
```
查询 → 分词 → 索引查找 → 相关性计算 → 结果排序 → 返回
```

#### 技术选型对比
| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **PostgreSQL 全文搜索** | 无需额外服务，事务一致 | 功能相对简单 | 中小规模数据 |
| **MeiliSearch** | 速度快，功能丰富，易用 | 需要额外部署 | 大规模数据，复杂搜索 |
| **Elasticsearch** | 功能最强大，生态完善 | 部署复杂，资源消耗大 | 超大规模，企业级 |

**推荐方案**：初期使用 PostgreSQL 全文搜索，后期可迁移到 MeiliSearch。

### 数据库设计

#### 连接池管理
- **Prisma Client**：自动连接池管理
- **连接数配置**：根据环境调整
- **连接超时**：防止资源泄露

#### 数据迁移策略
1. **开发环境**：`prisma db push` 自动同步
2. **测试环境**：脚本自动迁移
3. **生产环境**：手动审核迁移脚本

#### 备份策略
1. **定期备份**：每日自动备份到云存储
2. **增量备份**：每小时增量备份
3. **恢复测试**：每月测试恢复流程

## 部署架构

### 容器化部署
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/guizhang
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=guizhang
      - POSTGRES_PASSWORD=secure_password
      - POSTGRES_DB=guizhang
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 监控体系
1. **应用监控**：Prometheus + Grafana
2. **日志收集**：ELK Stack 或 Loki
3. **错误追踪**：Sentry
4. **性能分析**：OpenTelemetry

### 安全架构
1. **网络安全**：HTTPS 强制，CORS 配置
2. **数据安全**：加密存储，传输加密
3. **访问控制**：JWT 认证，RBAC 授权
4. **输入验证**：请求参数校验，SQL 注入防护
5. **速率限制**：防止暴力攻击

## 性能优化策略

### 前端优化
1. **代码分割**：动态导入，按需加载
2. **图片优化**：WebP 格式，懒加载
3. **缓存策略**：Service Worker 缓存
4. **预加载**：关键资源预加载
5. **虚拟列表**：长列表性能优化

### 后端优化
1. **数据库索引**：查询优化
2. **查询缓存**：Redis 缓存热点数据
3. **连接复用**：HTTP/2，连接池
4. **CDN 加速**：静态资源分发
5. **异步处理**：耗时操作队列化

### 网络优化
1. **HTTP/2**：多路复用，头部压缩
2. **Brotli 压缩**：文本资源压缩
3. **DNS 预解析**：减少 DNS 查找时间
4. **TCP 优化**：TCP 快速打开，窗口缩放

## 扩展性设计

### 水平扩展
1. **无状态应用**：支持多实例部署
2. **会话外置**：Redis 存储会话
3. **负载均衡**：Nginx 或云负载均衡器
4. **数据库分片**：按用户分片（预留）

### 垂直扩展
1. **资源升级**：CPU、内存、存储
2. **读写分离**：主从数据库架构
3. **缓存分层**：多级缓存策略

### 功能扩展
1. **插件系统**：支持第三方插件
2. **Webhook**：事件通知机制
3. **API 扩展**：开放 API 供第三方集成

## 技术决策记录

### 决策 1：选择 Next.js 而非单独前端+后端
- **理由**：简化部署，提高开发效率，统一技术栈
- **权衡**：牺牲了前后端完全分离的灵活性
- **缓解**：通过清晰的目录结构保持关注点分离

### 决策 2：使用 SQLite 开发，PostgreSQL 生产
- **理由**：开发简便，生产可靠
- **权衡**：需要处理数据库差异
- **缓解**：使用 Prisma ORM 抽象差异

### 决策 3：客户端搜索使用 Fuse.js
- **理由**：无需服务端支持，离线可用
- **权衡**：数据量大时性能可能下降
- **缓解**：限制客户端搜索范围，重要搜索走服务端

### 决策 4：PWA 而非 Electron 桌面应用
- **理由**：跨平台，更新方便，资源消耗低
- **权衡**：无法访问系统级 API
- **缓解**：必要时可通过浏览器扩展补充功能

## 未来架构演进

### 阶段 1：单机部署
- 所有服务运行在单台服务器
- 适合初期验证和小规模使用

### 阶段 2：微服务拆分
- 剪藏服务独立部署
- 搜索服务独立部署
- 用户服务独立部署

### 阶段 3：云原生架构
- Kubernetes 编排
- 服务网格（Istio）
- 自动扩缩容
- 多云部署

---

*架构设计持续演进，将根据实际需求和用户反馈不断优化。*