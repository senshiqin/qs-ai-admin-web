# 前端 API 映射

## 运行约定

- 本地前端：`http://localhost:5173`
- 本地后端：`http://localhost:8080`
- API 基础地址通过 `VITE_API_BASE_URL` 配置；未配置时使用同源代理。
- 登录令牌保存在 `localStorage.qs_ai_token`，请求拦截器自动附加 Bearer Token。

## 页面与接口

| 页面 | 文件 | API 模块 | 后端路径 |
| --- | --- | --- | --- |
| 登录 | `src/views/LoginView.vue` | `src/api/auth.ts` | `/api/v1/auth/login` |
| 仪表盘 | `src/views/DashboardView.vue` | `health.ts`、`documents.ts`、`ragTasks.ts` | `/health`、`/api/v1/ai/documents`、`/api/v1/ai/rag/tasks` |
| 聊天 | `src/views/ChatView.vue` | `chat.ts` | `/api/v1/ai/chat/send`、`/api/v1/ai/chat/stream` |
| 上下文 | `src/views/ContextView.vue` | `context.ts` | `/api/v1/ai/chat/context` |
| 文档管理 | `src/views/DocumentsView.vue` | `documents.ts`、`knowledgeBase.ts`、`ragTasks.ts` | `/api/v1/ai/documents`、`/api/v1/ai/knowledge-bases`、`/api/v1/ai/rag/tasks` |
| RAG 调试 | `src/views/RagView.vue` | `rag.ts`、`knowledgeBase.ts` | `/api/v1/ai/rag/**`、`/api/v1/ai/knowledge-bases` |
| RAG 任务 | `src/views/RagTasksView.vue` | `ragTasks.ts` | `/api/v1/ai/rag/tasks` |
| LangChain4j | `src/views/LangChain4jView.vue` | `langchain4j.ts` | `/api/v1/ai/langchain4j/**` |
| 模型配置 | `src/views/ModelConfigView.vue` | `modelConfig.ts` | `/api/v1/ai/model-config` |
| 监控 | `src/views/MonitorView.vue` | `actuator.ts` | `/actuator/**` |

## 类型维护

- 后端新增响应字段后，同步更新 `src/types/api.ts`。
- 页面只消费 API 模块，不直接写 `http.get/post`。
- SSE 请求统一复用 `src/api/rag.ts` 的 `postSse`。

## RAG 调试参数

增强检索和检索评估页面支持：

- `searchMode=VECTOR`：仅使用向量分。
- `searchMode=HYBRID`：向量分和关键词分融合。
- `vectorWeight`：HYBRID 模式下向量分权重，关键词权重为 `1 - vectorWeight`。

## 验收命令

```bash
npm run build
```

## Auth Session

- Login uses `POST /api/v1/user/login`.
- Register uses `POST /api/v1/user/register` and creates a normal `USER` account.
- Login responses include `accessToken`, `refreshToken`, and `roleCode`.
- `src/stores/auth.ts` stores the access token, refresh token, username, and role code in `localStorage`.
- `src/api/http.ts` automatically calls `POST /api/v1/user/refresh` once when an API request receives HTTP/API `401`, then retries the original request.
- If refresh fails, the frontend clears the session and redirects to login.
