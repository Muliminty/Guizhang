# 平台检测与内容类型识别功能

## 概述

平台检测功能是归藏(Guizhang)应用的核心组件之一，能够自动识别URL的平台来源和内容类型，并智能推荐处理策略。该功能支持主流内容平台（YouTube、B站、Twitter、Medium等）和多种内容类型（文章、视频、推文等）。

## 功能特性

### 1. 平台检测
- **支持平台**：YouTube、Bilibili、Twitter/X、Medium、知乎、GitHub、微博、TikTok、Reddit、Stack Overflow、dev.to、Hacker News等
- **检测方式**：URL模式匹配 + 元数据提取
- **置信度评分**：提供0-1的置信度评分

### 2. 内容类型识别
- **文章**：博客、专栏、文档等
- **视频**：YouTube、B站、TikTok等
- **推文**：Twitter、微博等
- **代码仓库**：GitHub等
- **讨论**：Reddit、Stack Overflow、知乎问答等
- **图片集**：图片画廊等
- **通用**：未识别类型的默认分类

### 3. 智能处理策略
- **剪藏(Clip)**：适合文章、文档等文本内容
- **稍后观看(Watch Later)**：适合视频、长文章等
- **书签(Bookmark)**：适合推文、代码仓库、讨论等
- **忽略(Ignore)**：不适合处理的内容

### 4. 元数据提取
- **基础信息**：标题、描述、作者、发布时间等
- **平台特定**：视频时长、观看数、点赞数等
- **内容分析**：字数统计、阅读时间估计等

## 架构设计

### 核心模块
```
lib/platform-detector/
├── index.ts              # 主服务入口
├── rule-manager.ts       # 规则管理器
├── cache.ts              # 缓存管理器
├── content-analyzer/     # 内容分析器
│   ├── index.ts          # 元数据提取器
│   ├── classifier.ts     # 内容类型分类器
│   └── strategy-decider.ts # 处理策略决策器
└── detectors/            # 平台特定检测器
    ├── youtube.ts        # YouTube检测器
    ├── bilibili.ts       # B站检测器
    └── generic.ts        # 通用检测器
```

### 检测流程
1. **URL规范化**：清理URL，移除跟踪参数
2. **缓存检查**：检查是否有缓存结果
3. **规则匹配**：使用正则表达式匹配平台
4. **元数据提取**：提取页面元数据（OG标签、JSON-LD等）
5. **内容分类**：基于规则和启发式方法分类内容类型
6. **策略决策**：根据内容类型和用户偏好决定处理方式
7. **结果缓存**：缓存检测结果供后续使用

## 快速开始

### 安装依赖
平台检测功能已集成到项目中，无需额外安装。

### 基本使用

#### 1. 检测单个URL
```typescript
import { detectPlatform } from '@/lib/platform-detector'

const result = await detectPlatform('https://www.youtube.com/watch?v=dQw4w9WgXcQ')

console.log(result)
// {
//   platform: 'youtube',
//   contentType: 'video',
//   confidence: 0.95,
//   processingStrategy: 'watch_later',
//   metadata: { ... }
// }
```

#### 2. 批量检测URL
```typescript
import { detectPlatforms } from '@/lib/platform-detector'

const results = await detectPlatforms([
  'https://www.youtube.com/watch?v=...',
  'https://medium.com/@user/article',
  'https://github.com/owner/repo'
])
```

#### 3. 使用平台检测服务
```typescript
import { platformDetector } from '@/lib/platform-detector'

// 获取服务实例
const detector = platformDetector

// 检测URL
const result = await detector.detect(url)

// 获取缓存统计
const stats = detector.getCacheStats()

// 清除缓存
detector.clearCache()
```

#### 4. 使用React组件
```tsx
import { EnhancedUrlInput } from '@/components/enhanced-url-input'

function MyComponent() {
  const handleSubmit = (url: string, detectionResult) => {
    console.log('提交URL:', url, detectionResult)
  }

  return (
    <EnhancedUrlInput
      placeholder="输入URL..."
      autoDetect={true}
      onSubmit={handleSubmit}
      showPlatformIcon={true}
      showContentType={true}
      showStrategy={true}
    />
  )
}
```

## API接口

### 1. 平台检测API
```
POST /api/platform/detect
```
**请求体**：
```json
{
  "url": "https://example.com",
  "options": {
    "enableMetadata": true,
    "cache": true,
    "timeout": 10000
  }
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "result": {
      "platform": "youtube",
      "contentType": "video",
      "confidence": 0.95,
      "processingStrategy": "watch_later",
      "metadata": { ... }
    },
    "processingTime": 123
  }
}
```

### 2. 批量检测API
```
POST /api/platform/detect
```
**请求体**：
```json
{
  "urls": [
    "https://example.com/1",
    "https://example.com/2"
  ]
}
```

### 3. 增强剪藏API
```
POST /api/clipper
```
**请求体**：
```json
{
  "url": "https://example.com",
  "strategy": "auto",
  "options": { ... },
  "metadata": {
    "title": "自定义标题",
    "tags": ["tag1", "tag2"]
  }
}
```

## 配置说明

### 平台规则配置
规则配置文件位于 `config/platform-rules.json`，支持以下配置：

```json
{
  "platform": "youtube",
  "patterns": [
    "^https://(?:www\\.)?youtube\\.com/watch\\?v=[\\w-]{11}"
  ],
  "contentType": "video",
  "metadataExtractor": "youtube",
  "priority": 100,
  "enabled": true,
  "description": "YouTube视频检测规则"
}
```

### 检测器配置
```typescript
import { createPlatformDetector } from '@/lib/platform-detector'

const detector = createPlatformDetector({
  cacheEnabled: true,
  cacheDuration: 300000, // 5分钟
  maxCacheSize: 1000,
  enableMetadataExtraction: true,
  timeout: 10000,
  userPreferences: {
    defaultStrategies: {
      article: 'clip',
      video: 'watch_later',
      tweet: 'bookmark'
    }
  }
})
```

## 扩展开发

### 添加新平台检测器

#### 1. 创建检测器文件
在 `lib/platform-detector/detectors/` 目录下创建新文件，例如 `myplatform.ts`：

```typescript
import { PlatformType, PlatformMetadata } from '../../types'

export class MyPlatformDetector {
  async detect(url: string) {
    // 检测逻辑
  }

  async extractMetadata(url: string): Promise<PlatformMetadata> {
    // 元数据提取逻辑
  }
}
```

#### 2. 添加平台规则
在 `config/platform-rules.json` 中添加新规则：

```json
{
  "platform": "myplatform",
  "patterns": ["^https://myplatform\\.com/.*"],
  "contentType": "article",
  "priority": 80,
  "enabled": true
}
```

#### 3. 集成到主服务
在 `lib/platform-detector/content-analyzer/index.ts` 中添加对新平台的支持：

```typescript
case 'myplatform':
  result = await this.extractMyPlatformMetadata(url)
  break
```

### 自定义内容分类规则

#### 1. 添加分类规则
```typescript
import { ContentTypeClassifier } from '@/lib/platform-detector'

const classifier = new ContentTypeClassifier()

classifier.addRule({
  platform: 'myplatform',
  patterns: ['myplatform\\.com/blog/'],
  contentType: 'article',
  confidence: 0.9,
  priority: 100
})
```

#### 2. 添加启发式规则
```typescript
// 在 ContentTypeClassifier 类中添加
private getDefaultRules(): ClassificationRule[] {
  return [
    ...existingRules,
    {
      platform: 'myplatform',
      patterns: ['myplatform\\.com/video/'],
      contentType: 'video',
      confidence: 0.8,
      priority: 90
    }
  ]
}
```

## 性能优化

### 缓存策略
- **内存缓存**：默认启用，缓存最近检测结果
- **缓存时长**：默认5分钟，可配置
- **缓存大小**：默认1000条记录，LRU淘汰策略
- **缓存统计**：提供命中率、内存使用等统计信息

### 性能监控
```typescript
const stats = platformDetector.getCacheStats()
console.log(stats)
// {
//   size: 42,
//   hits: 123,
//   misses: 45,
//   hitRate: 0.73,
//   oldestItemAge: 120000,
//   newestItemAge: 5000
// }
```

### 批量处理优化
- **并发控制**：限制同时检测的URL数量
- **超时控制**：单个检测超时时间可配置
- **错误处理**：单个URL检测失败不影响其他URL

## 错误处理

### 常见错误
1. **无效URL**：返回400错误
2. **检测超时**：返回降级结果（generic类型）
3. **网络错误**：返回缓存结果或降级结果
4. **平台API限制**：使用备用提取方法

### 降级策略
1. **平台降级**：无法识别时返回 'generic'
2. **内容类型降级**：无法分类时返回 'generic'
3. **策略降级**：无法决定时返回 'clip'
4. **元数据降级**：提取失败时返回基础信息

### 错误监控
```typescript
try {
  const result = await detectPlatform(url)
} catch (error) {
  console.error('平台检测失败:', error)

  // 返回降级结果
  return {
    platform: 'generic',
    contentType: 'generic',
    confidence: 0.1,
    error: error.message
  }
}
```

## 测试

### 单元测试
```typescript
// 测试URL模式匹配
test('YouTube URL检测', () => {
  const detector = new YouTubeDetector()
  const result = await detector.detect('https://youtube.com/watch?v=abc123')
  expect(result.isYouTube).toBe(true)
})

// 测试内容分类
test('文章内容分类', () => {
  const classifier = new ContentTypeClassifier()
  const result = classifier.classify('medium', { title: '如何学习编程' })
  expect(result).toBe('article')
})
```

### 集成测试
```typescript
// 测试完整检测流程
test('完整平台检测流程', async () => {
  const detector = createPlatformDetector()
  const result = await detector.detect('https://medium.com/article')

  expect(result.platform).toBe('medium')
  expect(result.contentType).toBe('article')
  expect(result.processingStrategy).toBe('clip')
})
```

### 端到端测试
```typescript
// 测试API端点
test('平台检测API', async () => {
  const response = await fetch('/api/platform/detect', {
    method: 'POST',
    body: JSON.stringify({ url: 'https://youtube.com/watch?v=test' })
  })

  const data = await response.json()
  expect(data.success).toBe(true)
  expect(data.data.result.platform).toBe('youtube')
})
```

## 部署与运维

### 环境配置
```bash
# 生产环境配置
PLATFORM_DETECTOR_CACHE_DURATION=300000
PLATFORM_DETECTOR_MAX_CACHE_SIZE=1000
PLATFORM_DETECTOR_TIMEOUT=10000

# YouTube API密钥（可选）
YOUTUBE_API_KEY=your_api_key_here
```

### 监控指标
1. **检测成功率**：成功检测的URL比例
2. **平均检测时间**：从请求到响应的平均时间
3. **缓存命中率**：缓存有效命中的比例
4. **各平台检测量**：各平台的检测次数统计
5. **错误率**：检测失败的比例

### 日志记录
```typescript
// 启用详细日志
const detector = createPlatformDetector({
  logging: {
    level: 'debug',
    enablePerformanceLogging: true
  }
})
```

## 常见问题

### Q1: 如何添加对新平台的支持？
A: 参考"扩展开发"章节，创建新的检测器并添加平台规则。

### Q2: 检测结果不准确怎么办？
A: 可以：
1. 检查URL格式是否正确
2. 查看平台规则是否匹配
3. 调整规则优先级
4. 添加更具体的URL模式

### Q3: 如何提高检测性能？
A: 可以：
1. 调整缓存时长和大小
2. 启用批量检测
3. 优化元数据提取逻辑
4. 使用CDN缓存检测结果

### Q4: 如何处理平台API限制？
A: 可以：
1. 使用备用提取方法（OG标签等）
2. 实现API密钥轮换
3. 增加请求间隔
4. 使用本地缓存减少API调用

### Q5: 如何自定义处理策略？
A: 可以通过 `userPreferences` 配置自定义策略：
```typescript
const detector = createPlatformDetector({
  userPreferences: {
    defaultStrategies: {
      article: 'clip',
      video: 'watch_later',
      tweet: 'bookmark'
    }
  }
})
```

## 版本历史

### v1.0.0 (2026-02-24)
- 初始版本发布
- 支持主流内容平台检测
- 实现内容类型识别
- 提供智能处理策略
- 集成缓存和性能优化

## 贡献指南

欢迎贡献代码、报告问题或提出建议：

1. Fork项目仓库
2. 创建功能分支
3. 提交更改
4. 创建Pull Request
5. 等待代码审查

## 许可证

本项目采用MIT许可证。详见LICENSE文件。