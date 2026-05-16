# QS-AI Admin Web - Code Wiki

## 1. 项目概述

**项目名称**: qs-ai-admin-web  
**版本**: 1.0.0  
**技术栈**: Vue 3 + TypeScript + Element Plus + Pinia + Vue Router + Vite  
**项目定位**: QS-AI Spring Boot 3.2.5 后端的前端管理控制台

## 2. 项目架构

### 2.1 整体架构图

```
qs-ai-admin-web/
├── src/
│   ├── api/              # API 接口封装
│   ├── composables/      # 组合式函数
│   ├── layouts/          # 布局组件
│   ├── router/           # 路由配置
│   ├── stores/           # Pinia 状态管理
│   ├── styles/           # 全局样式
│   ├── types/            # TypeScript 类型定义
│   ├── utils/            # 工具函数
│   ├── views/            # 页面组件
│   ├── App.vue           # 根组件
│   ├── env.d.ts          # 环境变量类型
│   └── main.ts           # 应用入口
├── .env.example          # 环境变量示例
├── index.html            # HTML 入口
├── package.json          # 项目依赖
├── tsconfig.json         # TypeScript 配置
├── vite.config.ts        # Vite 配置
└── README.md             # 项目说明
```

### 2.2 技术栈与依赖

| 技术/库 | 版本 | 用途 |
|---------|------|------|
| Vue | ^3.5.13 | 前端框架 |
| TypeScript | ^5.6.3 | 类型系统 |
| Element Plus | ^2.8.8 | UI 组件库 |
| Pinia | ^2.2.6 | 状态管理 |
| Vue Router | ^4.4.5 | 路由管理 |
| Axios | ^1.7.9 | HTTP 请求 |
| ECharts | ^5.5.1 | 数据可视化 |
| Vite | ^6.0.1 | 构建工具 |

## 3. 主要模块详解

### 3.1 API 模块 ([src/api](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/api/))

API 模块封装了所有与后端交互的接口，每个功能模块都有对应的文件。

#### 3.1.1 核心 HTTP 配置 ([http.ts](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/api/http.ts))

**主要功能**:
- 创建 Axios 实例，配置 baseURL 和超时时间
- 请求拦截器：自动添加 Authorization Bearer Token
- 响应拦截器：统一处理响应格式和错误（如 401/403 自动跳转登录）
- `unwrap<T>()` 工具函数：解包 API 响应

#### 3.1.2 API 模块列表

| 文件名 | 主要接口 |
|--------|----------|
| [auth.ts](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/api/auth.ts) | `login()` - 用户登录 |
| [chat.ts](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/api/chat.ts) | `sendChat()`, `streamChat()` - AI 聊天 |
| [documents.ts](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/api/documents.ts) | `pageDocuments()`, `getDocument()`, `deleteDocument()`, `batchUploadDocuments()` - 文档管理 |
| [health.ts](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/api/health.ts) | `getHealth()` - 健康检查 |
| [rag.ts](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/api/rag.ts) | `retrieveRag()`, `rewriteRagQuery()`, `retrieveRagAdvanced()`, `evaluateRag()`, `streamRagAnswer()` - RAG 相关 |
| [ragTasks.ts](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/api/ragTasks.ts) | RAG 任务管理 |
| [modelConfig.ts](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/api/modelConfig.ts) | 模型配置 |
| [actuator.ts](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/api/actuator.ts) | Spring Actuator 监控 |
| [context.ts](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/api/context.ts) | 上下文管理 |
| [langchain4j.ts](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/api/langchain4j.ts) | LangChain4j 相关 |

**SSE 流式处理** ([rag.ts#L69-L112](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/api/rag.ts#L69-L112)):
- `postSse()`: 通用 SSE 请求函数
- 支持事件类型: `sources`, `message`, `result`, `done`, `error`

### 3.2 状态管理 ([src/stores](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/stores/))

#### 3.2.1 认证状态管理 ([auth.ts](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/stores/auth.ts))

```typescript
export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    username: localStorage.getItem(USERNAME_KEY) || ''
  }),
  getters: {
    isAuthed: (state) => Boolean(state.token)
  },
  actions: {
    setSession(token: string, username: string),   // 设置会话
    clearSession()                                 // 清除会话
  }
})
```

**功能特点**:
- Token 和 Username 持久化到 localStorage
- `isAuthed` getter 用于判断登录状态

### 3.3 路由模块 ([src/router/index.ts](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/router/index.ts))

#### 3.3.1 路由结构

```
/ (重定向到 /dashboard)
├── /login (登录页，无权限限制)
└── / (需要认证)
    ├── /dashboard - 仪表盘
    ├── /documents - 文档管理
    ├── /rag-tasks - 任务中心
    ├── /rag - RAG 问答
    ├── /chat - AI 聊天
    ├── /langchain4j - LangChain4j 调试
    ├── /context - 上下文管理
    ├── /monitor - 系统监控
    ├── /student - 学生信息
    └── /model-config - 模型配置
```

#### 3.3.2 路由守卫

- **前置守卫**: 检查认证状态，未登录用户自动跳转 `/login`
- 已登录用户访问 `/login` 自动跳转 `/dashboard`

### 3.4 布局模块 ([src/layouts/AppLayout.vue](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/layouts/AppLayout.vue))

**布局结构**:
- 左侧侧边栏（232px）：品牌标识 + 导航菜单
- 右侧容器：顶部状态栏 + 主内容区
- 导航菜单项与路由一一对应

### 3.5 类型定义 ([src/types/api.ts](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/types/api.ts))

主要类型定义包括：

| 类型名称 | 用途 |
|----------|------|
| `ApiResponse<T>` | 通用 API 响应格式 |
| `LoginResponse` | 登录响应 |
| `DocumentItem` / `DocumentPage` | 文档数据 |
| `RagRetrieveResponse` / `RagChunk` | RAG 检索结果 |
| `RagIngestTask` / `RagIngestTaskPage` | RAG 任务 |
| `ChatMessage` / `ChatSendRequest` / `ChatSendResponse` | 聊天消息 |
| `ModelConfigResponse` / `ModelProvider` | 模型配置 |
| `LangChain4j*` | LangChain4j 相关 |

### 3.6 页面组件 ([src/views](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/views/))

| 页面文件 | 功能描述 |
|----------|----------|
| [LoginView.vue](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/views/LoginView.vue) | 用户登录页 |
| [DashboardView.vue](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/views/DashboardView.vue) | 仪表盘：健康状态、模型供应商、文档概览 |
| [DocumentsView.vue](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/views/DocumentsView.vue) | 文档管理：列表、上传、删除 |
| [RagView.vue](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/views/RagView.vue) | RAG 调试与问答 |
| [ChatView.vue](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/views/ChatView.vue) | AI 聊天界面 |
| [ModelConfigView.vue](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/views/ModelConfigView.vue) | 模型配置管理 |
| [LangChain4jView.vue](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/views/LangChain4jView.vue) | LangChain4j 功能调试 |
| [ContextView.vue](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/views/ContextView.vue) | 上下文管理 |
| [RagTasksView.vue](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/views/RagTasksView.vue) | RAG 任务中心 |
| [MonitorView.vue](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/views/MonitorView.vue) | 系统监控 |
| [Student.vue](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/views/Student.vue) | 学生信息管理 |

### 3.7 工具函数 ([src/utils/document.ts](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/src/utils/document.ts))

包含文档状态显示文本和类型映射、日期时间格式化等工具函数。

## 4. 依赖关系

```
App.vue
├── main.ts (应用入口)
│   ├── Pinia (状态管理)
│   ├── Vue Router (路由)
│   └── Element Plus (UI)
├── router/index.ts (路由)
│   ├── AppLayout.vue (布局)
│   └── views/* (页面)
│       ├── stores/auth.ts (认证状态)
│       ├── api/* (API 调用)
│       │   ├── http.ts (HTTP 配置)
│       │   └── types/api.ts (类型定义)
│       └── utils/* (工具函数)
```

## 5. 运行与部署

### 5.1 开发环境

```powershell
# 安装依赖
npm install

# 启动开发服务器 (监听 5173 端口，代理后端到 localhost:8080)
npm run dev

# 构建生产版本
npm run build

# 预览生产构建 (4173 端口)
npm run preview
```

### 5.2 环境变量

- `VITE_API_BASE_URL`: API 基础 URL（可选，默认空）
- 开发环境通过 Vite 代理 `/api`, `/health`, `/actuator` 到 `http://localhost:8080`

### 5.3 Vite 代理配置 ([vite.config.ts](file:///e:/Ai/JAVA_AI/QS-AI-Project1/qs-ai-admin-web/vite.config.ts))

```typescript
server: {
  proxy: {
    '/api': { target: 'http://localhost:8080', changeOrigin: true },
    '/health': { target: 'http://localhost:8080', changeOrigin: true },
    '/actuator': { target: 'http://localhost:8080', changeOrigin: true }
  }
}
```

## 6. 开发规范与约定

### 6.1 目录结构约定

- API 接口按功能模块拆分到独立文件
- 类型定义统一放在 `src/types/` 目录
- 页面组件放在 `src/views/` 目录
- 可复用组合式函数放在 `src/composables/`

### 6.2 命名约定

- 组件文件：大驼峰命名 (如 `AppLayout.vue`)
- API 函数：小驼峰命名 (如 `pageDocuments`, `sendChat`)
- 类型定义：大驼峰命名 (如 `ApiResponse`, `DocumentItem`)
- Store: `use*Store` 格式 (如 `useAuthStore`)

### 6.3 代码风格

- 使用 TypeScript 严格类型检查
- 使用 Vue 3 `<script setup>` 语法
- 使用 Element Plus 组件库构建 UI

## 7. 关键工作流

### 7.1 认证流程

1. 用户在 `/login` 页面输入用户名密码
2. 调用 `login()` API
3. 成功后调用 `authStore.setSession(token, username)`
4. 自动跳转到 `/dashboard`

### 7.2 RAG 问答流程

1. 用户在 `/rag` 页面输入查询
2. 调用 `streamRagAnswer()` 建立 SSE 连接
3. 接收 `sources` 事件显示检索到的文档片段
4. 接收 `message` 事件流式展示 AI 回答
5. 接收 `done` 事件完成问答

## 8. 核心类与函数速查表

### 8.1 API 核心函数

| 函数 | 文件 | 说明 |
|------|------|------|
| `login(username, password)` | auth.ts | 用户登录 |
| `pageDocuments(params)` | documents.ts | 分页查询文档 |
| `batchUploadDocuments(payload)` | documents.ts | 批量上传文档 |
| `retrieveRag(payload)` | rag.ts | RAG 检索 |
| `streamRagAnswer(payload, handlers)` | rag.ts | 流式 RAG 问答 |
| `sendChat(payload)` | chat.ts | 发送聊天消息 |
| `streamChat(payload, onMessage, onDone)` | chat.ts | 流式聊天 |
| `getModelConfig()` | modelConfig.ts | 获取模型配置 |
| `getHealth()` | health.ts | 健康检查 |

### 8.2 状态管理

| 函数/属性 | 说明 |
|-----------|------|
| `useAuthStore()` | 获取认证 Store 实例 |
| `auth.isAuthed` | 是否已登录 |
| `auth.token` | 当前 Token |
| `auth.setSession(token, username)` | 设置会话 |
| `auth.clearSession()` | 清除会话并登出 |
