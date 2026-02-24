# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

归藏(Guizhang)是一个现代化的文章剪藏与知识管理应用，采用Next.js 15 (App Router) + TypeScript + Tailwind CSS技术栈。项目处于早期开发阶段，已完成基础框架和平台检测功能。

## 开发命令

### 基础命令
```bash
npm run dev          # 启动开发服务器 (localhost:3000)
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
```

### 代码质量
```bash
npm run lint         # 运行ESLint检查
npm run lint:detailed # 详细ESLint检查
npm run lint:fix     # 自动修复ESLint问题
npm run format       # 使用Prettier格式化代码
npm run format:check # 检查代码格式
npm run type-check   # TypeScript类型检查
npm run validate     # 完整验证 (类型检查 + 代码检查 + 格式检查)
```

### 项目设置
```bash
npm run prepare      # 安装Git钩子 (husky)
```

## 项目架构

### 目录结构
```
app/                    # Next.js App Router (核心应用逻辑)
├── api/               # API路由 (服务端逻辑)
│   ├── clipper/       # 剪藏服务API
│   └── platform/detect/ # 平台检测API
├── demo/              # 功能演示页面
└── layout.tsx/page.tsx # 根布局和首页

components/            # 可复用React组件
├── enhanced-url-input.tsx  # 增强URL输入组件 (集成平台检测)
└── simple-url-input.tsx    # 简化URL输入组件

lib/                   # 核心业务逻辑库
├── platform-detector/ # 平台检测服务 (核心功能)
│   ├── detectors/     # 平台特定检测器 (YouTube, B站等)
│   ├── content-analyzer/ # 内容分析器
│   ├── rule-manager.ts    # 规则管理器
│   ├── cache.ts       # 缓存管理器
│   └── index.ts       # 主入口
└── utils.ts           # 通用工具函数

types/                 # TypeScript类型定义
└── index.ts           # 全局类型导出 (包含平台检测相关类型)

config/                # 配置文件
└── platform-rules.json # 平台检测规则配置

docs/                  # 项目文档
├── ARCHITECTURE.md    # 架构设计文档
├── IMPLEMENTATION-SUMMARY.md # 实现总结
└── PLATFORM-DETECTION.md # 平台检测功能文档
```

### 核心架构模式

#### 1. 平台检测服务架构
- **分层设计**: URL规范化 → 缓存检查 → 规则匹配 → 元数据提取 → 内容分类 → 策略决策
- **插件化架构**: 每个平台有独立的检测器，易于扩展新平台
- **缓存策略**: 内存缓存减少重复检测，支持批量处理优化

#### 2. 类型系统
- 严格TypeScript配置 (`exactOptionalPropertyTypes: true`)
- 完整的平台相关类型定义 (`PlatformType`, `ContentType`, `ProcessingStrategy`)
- 路径别名配置: `@/*`, `@components/*`, `@lib/*` 等

#### 3. API设计
- 使用Next.js API Routes (App Router)
- RESTful风格，支持JSON请求/响应
- 完整的错误处理和验证

#### 4. 前端组件设计
- 客户端组件使用 `'use client'` 指令
- 服务端组件默认 (Next.js 15)
- Tailwind CSS + 响应式设计

## 技术栈详情

### 核心依赖
- **Next.js 15**: App Router, 服务端组件, API Routes
- **React 19**: 最新React版本
- **TypeScript 5.9**: 严格类型检查
- **Tailwind CSS 4**: 原子化CSS, 自定义设计系统
- **Zustand**: 轻量级状态管理
- **@tanstack/react-query**: 数据获取和缓存
- **Dexie.js**: IndexedDB封装 (离线存储)
- **@mozilla/readability + turndown**: 网页内容提取和HTML转Markdown

### 开发工具
- **ESLint 9**: TypeScript + React规则, Prettier集成
- **Prettier 3**: 代码格式化
- **husky**: Git钩子管理
- **PostCSS + Autoprefixer**: CSS处理

## 平台检测功能

### 已实现功能
1. **平台识别**: YouTube, B站, Twitter, Medium, 知乎, GitHub等
2. **内容分类**: 文章, 视频, 推文, 代码仓库, 文档, 讨论等
3. **处理策略**: 剪藏, 稍后观看, 书签, 忽略
4. **元数据提取**: 标题, 描述, 作者, 时长, 发布时间等

### 核心文件
- `lib/platform-detector/index.ts`: 主服务入口
- `lib/platform-detector/simple.ts`: 简化版本 (避免类型问题)
- `config/platform-rules.json`: 平台规则配置
- `types/index.ts`: 平台相关类型定义

### 使用示例
```typescript
// 基本检测
import { detectPlatform } from '@/lib/platform-detector'
const result = await detectPlatform('https://youtube.com/watch?v=example')

// 简化版本
import { simpleDetect } from '@/lib/platform-detector/simple'
const result = await simpleDetect('https://youtube.com/watch?v=example')

// React组件
import { SimpleUrlInput } from '@/components/simple-url-input'
<SimpleUrlInput onSubmit={handleSubmit} />
```

## 开发注意事项

### TypeScript严格模式
项目启用了严格类型检查，特别注意：
- `exactOptionalPropertyTypes: true` - 可选属性需要显式处理undefined
- `noUncheckedIndexedAccess: true` - 数组/对象访问需要空值检查
- 简化版本 (`simple.ts`) 避免了复杂的类型问题

### 路径别名
使用配置的路径别名，不要使用相对路径：
```typescript
// 正确
import { detectPlatform } from '@/lib/platform-detector'
import { SimpleUrlInput } from '@/components/simple-url-input'

// 避免
import { detectPlatform } from '../../lib/platform-detector'
```

### 组件设计
- 客户端组件必须使用 `'use client'` 指令
- 服务端组件默认，适合数据获取和SEO
- 使用Tailwind CSS类名，避免自定义CSS

### API开发
- API路由位于 `app/api/` 目录
- 使用NextRequest/NextResponse处理请求
- 遵循RESTful设计原则
- 包含完整的错误处理和状态码

## 开发规则

### 项目管理规则

#### 1. 进度更新规则
1. **任务完成更新**: 每个任务完成后必须立即更新`docs/PROGRESS.md`和`docs/TASKS.md`
2. **更新频率**: 遵循"每次完成一个任务就更新目前的进度任务"原则
3. **更新内容**: 包含任务描述、完成状态、实际工时、相关文件、遇到的问题和解决方案
4. **状态标记**: 使用标准状态标记（✅ 完成, 🔄 进行中, ⏸️ 暂停, ❌ 取消）

#### 2. 任务跟踪规则
1. **任务状态同步**: 保持`docs/TASKS.md`中的任务状态与实际进度同步
2. **工时记录**: 在`docs/PROGRESS.md`中记录实际工时并与估计工时对比
3. **依赖管理**: 明确任务依赖关系，阻塞任务优先解决
4. **优先级管理**: 按照P0（必须完成）、P1（应该完成）、P2（可以完成）优先级执行

#### 3. 文档更新规则
1. **进度文档**: 代码变更时同步更新`docs/PROGRESS.md`中的进度状态
2. **任务文档**: 更新`docs/TASKS.md`中的任务状态和完成情况
3. **变更记录**: 在`docs/PROGRESS.md`中记录重要变更和影响

#### 4. 进度报告规则
1. **状态透明**: 通过`docs/PROGRESS.md`保持项目进度透明
2. **定期同步**: 定期更新进度报告，反映最新状态
3. **问题记录**: 在进度文档中记录遇到的问题和解决方案

### 5. 需求管理规则

#### 5.1 PRD更新规则
1. **变更触发更新**: 任何需求变更必须同步更新`docs/PRD.md`
2. **更新时效性**: 需求变更批准后24小时内完成PRD更新
3. **版本控制**: 每次PRD更新必须更新版本号和变更记录
4. **变更追溯**: PRD变更必须能够追溯到具体的变更申请

#### 5.2 需求一致性检查
1. **开发前检查**: 开始开发新功能前，确认PRD中的需求描述
2. **实现中验证**: 开发过程中验证实现与PRD需求的一致性
3. **发布前核对**: 版本发布前核对PRD与实际功能的一致性
4. **文档联动**: PRD变更时，同步更新TASKS.md中的相关任务

#### 5.3 变更影响评估
1. **影响分析**: 需求变更时评估对现有功能、进度、成本的影响
2. **文档更新范围**: 确定需要更新的文档范围（PRD、TASKS、API等）
3. **沟通机制**: PRD更新后及时通知相关开发人员
4. **历史保留**: 保留PRD历史版本，支持版本回滚和审计

## 配置说明

### TypeScript配置 (`tsconfig.json`)
- 严格模式启用，包含实验性装饰器支持
- 路径别名配置完善
- 针对Next.js优化

### Next.js配置 (`next.config.js`)
- 图片优化配置
- 安全头部设置
- 生产环境移除console.log
- 实验性功能: serverActions, optimizeCss

### ESLint配置 (`eslint.config.js`)
- TypeScript + React规则
- Prettier集成
- 严格的代码质量要求

## 文档资源

### 核心文档
1. `docs/ARCHITECTURE.md` - 详细架构设计
2. `docs/PLATFORM-DETECTION.md` - 平台检测功能完整说明
3. `docs/IMPLEMENTATION-SUMMARY.md` - 实现总结和下一步计划

### 开发记录
- `经验/` 目录包含开发经验记录
- `docs/PROGRESS.md` 跟踪开发进度
- `docs/TASKS.md` 管理开发任务

## 开发流程

1. **代码修改前**: 运行 `npm run validate` 确保代码质量
2. **开发过程中**: 使用 `npm run dev` 实时预览
3. **任务完成后**: 立即更新进度文档（`docs/PROGRESS.md`和`docs/TASKS.md`）
4. **提交前**: Git钩子自动运行代码检查和格式化
5. **部署前**: 运行 `npm run build` 确保构建成功

## 故障排除

### 常见TypeScript错误
1. **可选属性问题**: 使用条件赋值或类型断言
2. **数组/对象访问**: 添加空值检查
3. **导入路径**: 使用配置的路径别名

### 构建问题
1. **类型检查失败**: 运行 `npm run type-check` 查看详细错误
2. **ESLint错误**: 运行 `npm run lint:fix` 自动修复
3. **格式问题**: 运行 `npm run format` 重新格式化

### 平台检测功能
1. **新平台支持**: 在 `config/platform-rules.json` 添加规则
2. **检测不准确**: 调整规则优先级或添加更具体的模式
3. **性能问题**: 调整缓存策略或启用批量处理

## 扩展开发

### 添加新平台检测器
1. 在 `lib/platform-detector/detectors/` 创建新文件
2. 实现 `detect()` 和 `extractMetadata()` 方法
3. 在 `config/platform-rules.json` 添加规则配置
4. 在 `types/index.ts` 添加平台类型定义

### 添加新API端点
1. 在 `app/api/` 创建新目录和 `route.ts` 文件
2. 实现相应的HTTP方法 (GET, POST等)
3. 遵循现有的错误处理和响应格式
4. 更新相关文档

### 添加新React组件
1. 在 `components/` 目录创建新文件
2. 确定组件类型 (客户端/服务端)
3. 使用TypeScript定义Props接口
4. 遵循现有的样式和设计模式