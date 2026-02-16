# API 接口文档

## 概述

归藏提供 RESTful API 接口，用于管理文章、标签、搜索等核心功能。所有 API 均遵循统一的响应格式和错误处理机制。

## 基础信息

### 接口地址
- 开发环境：`http://localhost:3000/api`
- 生产环境：`https://your-domain.com/api`

### 认证方式
> 注：当前版本为单用户应用，暂无需认证。预留 JWT 认证接口供未来扩展。

```http
Authorization: Bearer <token>
```

### 请求头
```http
Content-Type: application/json
Accept: application/json
```

### 响应格式
#### 成功响应
```json
{
  "success": true,
  "data": { /* 响应数据 */ },
  "meta": { /* 分页信息等元数据 */ },
  "timestamp": "2026-02-16T13:45:00.000Z"
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": { /* 错误详情 */ }
  },
  "timestamp": "2026-02-16T13:45:00.000Z"
}
```

### 错误代码
| 代码 | 描述 | HTTP 状态码 |
|------|------|-------------|
| `VALIDATION_ERROR` | 请求参数验证失败 | 400 |
| `NOT_FOUND` | 资源不存在 | 404 |
| `DUPLICATE_RESOURCE` | 资源已存在 | 409 |
| `RATE_LIMIT_EXCEEDED` | 请求频率超限 | 429 |
| `INTERNAL_ERROR` | 服务器内部错误 | 500 |
| `CLIPPER_ERROR` | 剪藏服务错误 | 502 |
| `NETWORK_ERROR` | 网络请求失败 | 503 |

## 文章管理

### 获取文章列表
获取文章列表，支持分页、筛选、排序。

```http
GET /api/articles
```

#### 查询参数
| 参数 | 类型 | 描述 | 默认值 |
|------|------|------|--------|
| `page` | integer | 页码 | 1 |
| `limit` | integer | 每页数量 | 20 |
| `q` | string | 搜索关键词 | - |
| `tag` | string | 标签 ID 筛选 | - |
| `starred` | boolean | 仅显示星标文章 | - |
| `archived` | boolean | 仅显示归档文章 | - |
| `sort` | string | 排序字段 (`created_at`, `updated_at`, `title`, `clipped_at`) | `created_at` |
| `order` | string | 排序方向 (`asc`, `desc`) | `desc` |
| `from` | string | 开始时间 (ISO 8601) | - |
| `to` | string | 结束时间 (ISO 8601) | - |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "clq5f8v3a0000vwc8kq5q5q5q",
        "url": "https://example.com/article",
        "title": "文章标题",
        "excerpt": "文章摘要...",
        "cover_image": "https://example.com/image.jpg",
        "author": "作者名",
        "source": "example.com",
        "language": "zh-CN",
        "word_count": 1500,
        "reading_time": 5,
        "is_starred": false,
        "is_archived": false,
        "status": "active",
        "tags": ["tag1", "tag2"],
        "clipped_at": "2026-02-16T13:45:00.000Z",
        "created_at": "2026-02-16T13:45:00.000Z",
        "updated_at": "2026-02-16T13:45:00.000Z"
      }
    ]
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

### 获取文章详情
获取指定文章的完整信息，包括内容。

```http
GET /api/articles/{id}
```

#### 路径参数
| 参数 | 类型 | 描述 |
|------|------|------|
| `id` | string | 文章 ID |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "article": {
      "id": "clq5f8v3a0000vwc8kq5q5q5q",
      "url": "https://example.com/article",
      "title": "文章标题",
      "content": "# Markdown 内容\n\n文章正文...",
      "html": "<h1>HTML 内容</h1>",
      "excerpt": "文章摘要...",
      "cover_image": "https://example.com/image.jpg",
      "author": "作者名",
      "source": "example.com",
      "language": "zh-CN",
      "word_count": 1500,
      "reading_time": 5,
      "is_starred": false,
      "is_archived": false,
      "status": "active",
      "tags": [
        {
          "id": "tag1",
          "name": "技术",
          "color": "#3b82f6"
        }
      ],
      "clipped_at": "2026-02-16T13:45:00.000Z",
      "created_at": "2026-02-16T13:45:00.000Z",
      "updated_at": "2026-02-16T13:45:00.000Z"
    }
  }
}
```

### 创建文章（剪藏）
通过 URL 创建新文章，自动抓取和解析网页内容。

```http
POST /api/articles
```

#### 请求体
```json
{
  "url": "https://example.com/article",
  "options": {
    "force_refresh": false,  // 是否强制重新抓取（忽略缓存）
    "include_html": false,   // 是否保存原始 HTML
    "tags": ["技术", "前端"]  // 初始标签（名称数组）
  }
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "article": {
      "id": "clq5f8v3a0000vwc8kq5q5q5q",
      "status": "processing",  // processing, completed, error
      "message": "正在抓取文章内容..."
    }
  }
}
```

> **注意**：这是一个异步操作，文章状态可能为 `processing`。客户端应轮询文章详情接口或使用 WebSocket 获取完成状态。

### 更新文章
更新文章信息（标题、内容、标签等）。

```http
PUT /api/articles/{id}
```

#### 路径参数
| 参数 | 类型 | 描述 |
|------|------|------|
| `id` | string | 文章 ID |

#### 请求体
```json
{
  "title": "新标题",
  "content": "# 更新后的内容",
  "is_starred": true,
  "is_archived": false,
  "tags": ["技术", "前端", "JavaScript"]
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "article": {
      "id": "clq5f8v3a0000vwc8kq5q5q5q",
      "updated_at": "2026-02-16T13:50:00.000Z"
    }
  }
}
```

### 删除文章
删除指定文章。

```http
DELETE /api/articles/{id}
```

#### 路径参数
| 参数 | 类型 | 描述 |
|------|------|------|
| `id` | string | 文章 ID |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

### 同步文章内容
重新抓取和解析文章内容，更新到最新版本。

```http
POST /api/articles/{id}/sync
```

#### 路径参数
| 参数 | 类型 | 描述 |
|------|------|------|
| `id` | string | 文章 ID |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "article": {
      "id": "clq5f8v3a0000vwc8kq5q5q5q",
      "status": "processing",
      "message": "正在同步文章内容..."
    }
  }
}
```

### 批量操作
批量操作文章（星标、归档、删除等）。

```http
POST /api/articles/batch
```

#### 请求体
```json
{
  "action": "star",  // star, unstar, archive, unarchive, delete
  "article_ids": ["id1", "id2", "id3"]
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "processed": 3,
    "succeeded": 3,
    "failed": 0,
    "failures": []
  }
}
```

## 剪藏服务

### 抓取网页内容
直接抓取网页内容，返回原始 HTML 和元数据。

```http
POST /api/clipper/fetch
```

#### 请求体
```json
{
  "url": "https://example.com/article",
  "options": {
    "timeout": 30000,
    "user_agent": "Mozilla/5.0 Guizhang-Clipper/1.0",
    "use_playwright": false,  // 是否使用 Playwright（处理动态页面）
    "wait_for_selector": null  // 等待特定选择器出现
  }
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "url": "https://example.com/article",
    "html": "<!DOCTYPE html><html>...</html>",
    "metadata": {
      "title": "文章标题",
      "description": "文章描述",
      "author": "作者名",
      "language": "zh-CN",
      "published_time": "2026-02-16T00:00:00.000Z",
      "modified_time": "2026-02-16T00:00:00.000Z",
      "site_name": "Example",
      "favicon": "https://example.com/favicon.ico"
    },
    "status": {
      "status_code": 200,
      "content_type": "text/html",
      "content_length": 15000,
      "response_time": 1200
    }
  }
}
```

### 解析网页内容
解析 HTML 内容，提取文章正文和元数据。

```http
POST /api/clipper/parse
```

#### 请求体
```json
{
  "html": "<!DOCTYPE html><html>...</html>",
  "url": "https://example.com/article",
  "options": {
    "extract_content": true,  // 是否提取正文
    "extract_metadata": true, // 是否提取元数据
    "convert_to_markdown": true  // 是否转换为 Markdown
  }
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "content": {
      "html": "<article><h1>标题</h1><p>正文...</p></article>",
      "markdown": "# 标题\n\n正文...",
      "text": "标题 正文...",
      "length": {
        "html": 5000,
        "markdown": 3000,
        "text": 2000
      }
    },
    "metadata": {
      "title": "文章标题",
      "author": "作者名",
      "published_date": "2026-02-16T00:00:00.000Z",
      "reading_time": 5,
      "word_count": 1500,
      "excerpt": "文章摘要...",
      "cover_image": "https://example.com/image.jpg"
    },
    "stats": {
      "paragraphs": 10,
      "images": 3,
      "links": 15,
      "tables": 1,
      "code_blocks": 2
    }
  }
}
```

### 获取剪藏服务状态
获取剪藏服务的健康状态和统计信息。

```http
GET /api/clipper/status
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "uptime": 86400,
    "statistics": {
      "total_requests": 1000,
      "successful_requests": 950,
      "failed_requests": 50,
      "average_response_time": 1200,
      "cache_hit_rate": 0.65
    },
    "resources": {
      "memory_usage": "45%",
      "cpu_usage": "12%",
      "active_connections": 5
    }
  }
}
```

## 标签管理

### 获取标签列表
获取所有标签。

```http
GET /api/tags
```

#### 查询参数
| 参数 | 类型 | 描述 | 默认值 |
|------|------|------|--------|
| `q` | string | 搜索关键词 | - |
| `sort` | string | 排序字段 (`name`, `article_count`, `created_at`) | `name` |
| `order` | string | 排序方向 (`asc`, `desc`) | `asc` |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "id": "clq5f8v3b0001vwc8kq5q5q5q",
        "name": "技术",
        "color": "#3b82f6",
        "description": "技术相关文章",
        "article_count": 25,
        "created_at": "2026-02-16T13:45:00.000Z"
      }
    ]
  }
}
```

### 创建标签
创建新标签。

```http
POST /api/tags
```

#### 请求体
```json
{
  "name": "新技术",
  "color": "#10b981",
  "description": "新兴技术领域"
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "tag": {
      "id": "clq5f8v3b0002vwc8kq5q5q5q",
      "name": "新技术",
      "color": "#10b981",
      "description": "新兴技术领域",
      "article_count": 0,
      "created_at": "2026-02-16T13:45:00.000Z"
    }
  }
}
```

### 更新标签
更新标签信息。

```http
PUT /api/tags/{id}
```

#### 路径参数
| 参数 | 类型 | 描述 |
|------|------|------|
| `id` | string | 标签 ID |

#### 请求体
```json
{
  "name": "更新后的标签名",
  "color": "#ef4444",
  "description": "更新后的描述"
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "tag": {
      "id": "clq5f8v3b0002vwc8kq5q5q5q",
      "updated_at": "2026-02-16T13:50:00.000Z"
    }
  }
}
```

### 删除标签
删除标签。

```http
DELETE /api/tags/{id}
```

#### 路径参数
| 参数 | 类型 | 描述 |
|------|------|------|
| `id` | string | 标签 ID |

#### 查询参数
| 参数 | 类型 | 描述 | 默认值 |
|------|------|------|--------|
| `remove_from_articles` | boolean | 是否从文章中移除该标签 | `false` |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "deleted": true,
    "articles_affected": 5
  }
}
```

## 搜索服务

### 全文搜索
搜索文章内容。

```http
GET /api/search
```

#### 查询参数
| 参数 | 类型 | 描述 | 默认值 |
|------|------|------|--------|
| `q` | string | 搜索关键词 | **必填** |
| `page` | integer | 页码 | 1 |
| `limit` | integer | 每页数量 | 20 |
| `fields` | string | 搜索字段 (`title`, `content`, `both`) | `both` |
| `highlight` | boolean | 是否返回高亮片段 | `true` |
| `fuzziness` | number | 模糊匹配程度 (0-2) | 0.5 |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "article": {
          "id": "clq5f8v3a0000vwc8kq5q5q5q",
          "title": "文章标题",
          "excerpt": "文章摘要...",
          "author": "作者名",
          "clipped_at": "2026-02-16T13:45:00.000Z"
        },
        "score": 0.85,
        "highlights": {
          "title": ["<mark>搜索</mark>关键词"],
          "content": ["...包含<mark>搜索</mark>关键词的片段..."]
        }
      }
    ]
  },
  "meta": {
    "query": "搜索关键词",
    "total": 45,
    "took_ms": 120
  }
}
```

### 搜索建议
获取搜索建议（自动完成）。

```http
GET /api/search/suggest
```

#### 查询参数
| 参数 | 类型 | 描述 | 默认值 |
|------|------|------|--------|
| `q` | string | 搜索前缀 | **必填** |
| `limit` | integer | 建议数量 | 10 |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "type": "query",
        "text": "JavaScript 教程",
        "count": 15
      },
      {
        "type": "tag",
        "text": "JavaScript",
        "count": 42
      },
      {
        "type": "author",
        "text": "张三",
        "count": 8
      }
    ]
  }
}
```

## 同步服务

### 获取同步状态
获取文章同步状态。

```http
GET /api/sync/status
```

#### 查询参数
| 参数 | 类型 | 描述 | 默认值 |
|------|------|------|--------|
| `article_id` | string | 文章 ID（可选） | - |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "status": "idle",  // idle, syncing, error
    "last_sync": "2026-02-16T12:00:00.000Z",
    "next_sync": "2026-02-17T12:00:00.000Z",
    "statistics": {
      "total_articles": 150,
      "synced_articles": 145,
      "failed_articles": 5,
      "pending_articles": 0
    }
  }
}
```

### 手动触发同步
手动触发文章同步。

```http
POST /api/sync/trigger
```

#### 请求体
```json
{
  "scope": "all",  // all, starred, recent, specific
  "article_ids": ["id1", "id2"],  // scope 为 specific 时使用
  "force": false  // 是否强制同步（即使未到更新时间）
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "job_id": "sync_job_123456",
    "status": "queued",
    "estimated_time": 300  // 预计耗时（秒）
  }
}
```

## 系统信息

### 健康检查
检查系统健康状况。

```http
GET /api/health
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-02-16T13:45:00.000Z",
    "services": {
      "database": {
        "status": "healthy",
        "latency_ms": 12
      },
      "cache": {
        "status": "healthy",
        "latency_ms": 5
      },
      "clipper": {
        "status": "healthy",
        "latency_ms": 1200
      }
    },
    "version": "1.0.0",
    "uptime": 86400
  }
}
```

### 系统统计
获取系统统计信息。

```http
GET /api/stats
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "articles": {
      "total": 150,
      "starred": 25,
      "archived": 10,
      "by_source": {
        "example.com": 45,
        "blog.example.org": 32
      },
      "by_language": {
        "zh-CN": 120,
        "en-US": 30
      }
    },
    "tags": {
      "total": 20,
      "most_used": ["技术", "前端", "JavaScript"]
    },
    "clipper": {
      "total_requests": 1000,
      "success_rate": 0.95,
      "average_response_time": 1200
    },
    "storage": {
      "database_size": "45 MB",
      "cache_size": "12 MB"
    }
  }
}
```

## WebSocket 实时通知

> 预留功能，支持实时通知文章剪藏完成、同步状态更新等。

### 连接地址
```
ws://localhost:3000/api/ws
```

### 消息格式
```json
{
  "type": "article_processed",
  "payload": {
    "article_id": "clq5f8v3a0000vwc8kq5q5q5q",
    "status": "completed",
    "message": "文章剪藏完成"
  },
  "timestamp": "2026-02-16T13:45:00.000Z"
}
```

### 事件类型
| 事件类型 | 描述 | 触发条件 |
|----------|------|----------|
| `article_processing` | 文章开始处理 | 剪藏任务开始 |
| `article_processed` | 文章处理完成 | 剪藏任务完成 |
| `article_sync_started` | 文章同步开始 | 同步任务开始 |
| `article_sync_completed` | 文章同步完成 | 同步任务完成 |
| `system_notification` | 系统通知 | 系统事件 |

## 速率限制

### 限制规则
| 端点 | 限制规则 | 说明 |
|------|----------|------|
| 所有 API | 1000 次/小时 | 全局限制 |
| `/api/clipper/*` | 60 次/分钟 | 剪藏服务限制 |
| `/api/articles` (POST) | 30 次/分钟 | 创建文章限制 |

### 响应头
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1708099200
```

## 版本管理

API 版本通过 URL 前缀管理：
- `v1`：当前稳定版本
- `beta`：测试版本

示例：`/api/v1/articles`

---

*API 文档持续更新，具体实现可能有所调整。*