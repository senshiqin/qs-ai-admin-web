import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/layouts/AppLayout.vue'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import DocumentsView from '@/views/DocumentsView.vue'
import RagView from '@/views/RagView.vue'
import ChatView from '@/views/ChatView.vue'
import ModelConfigView from '@/views/ModelConfigView.vue'
import StudentView from '@/views/Student.vue'
import LangChain4jView from '@/views/LangChain4jView.vue'
import ContextView from '@/views/ContextView.vue'
import RagTasksView from '@/views/RagTasksView.vue'
import MonitorView from '@/views/MonitorView.vue'
import UsersView from '@/views/UsersView.vue'
import ForbiddenView from '@/views/ForbiddenView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginView },
    {
      path: '/',
      component: AppLayout,
      redirect: '/dashboard',
      meta: { requiresAuth: true },
      children: [
        { path: 'dashboard', component: DashboardView, meta: { title: '仪表盘', permission: 'dashboard:view' } },
        { path: 'documents', component: DocumentsView, meta: { title: '文档管理', permission: 'document:view' } },
        { path: 'rag', component: RagView, meta: { title: 'RAG 调试', permission: 'rag:debug' } },
        { path: 'chat', component: ChatView, meta: { title: 'AI 聊天', permission: 'chat:use' } },
        { path: 'langchain4j', component: LangChain4jView, meta: { title: 'LangChain4j 调试', permission: 'rag:debug' } },
        { path: 'context', component: ContextView, meta: { title: '上下文管理', permission: 'chat:use' } },
        { path: 'rag-tasks', component: RagTasksView, meta: { title: '任务中心', permission: 'document:view' } },
        { path: 'monitor', component: MonitorView, meta: { title: '系统监控', permission: 'monitor:view' } },
        { path: 'forbidden', component: ForbiddenView, meta: { title: '权限不足' } },
        { path: 'users', component: UsersView, meta: { title: '用户管理', permission: 'admin:user-manage' } },
        { path: 'student', component: StudentView, meta: { title: '学生信息' } },
        { path: 'model-config', component: ModelConfigView, meta: { title: '模型配置', permission: 'model-config:view' } }
      ]
    }
  ]
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthed) {
    return '/login'
  }
  const permission = to.meta.permission
  if (typeof permission === 'string' && !auth.hasPermission(permission)) {
    return '/forbidden'
  }
  if (to.path === '/login' && auth.isAuthed) {
    return '/dashboard'
  }
  return true
})

export default router
