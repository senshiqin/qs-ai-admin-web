<template>
  <el-container class="layout">
    <el-aside width="232px" class="sidebar">
      <div class="brand">
        <div class="brand-mark">QS</div>
        <div>
          <div class="brand-title">QS-AI Admin</div>
          <div class="brand-subtitle">AI 后台工作台</div>
        </div>
      </div>
      <el-menu :default-active="$route.path" router class="nav-menu">
        <el-menu-item index="/dashboard">
          <el-icon><DataBoard /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/documents">
          <el-icon><Files /></el-icon>
          <span>文档管理</span>
        </el-menu-item>
        <el-menu-item index="/rag-tasks">
          <el-icon><Operation /></el-icon>
          <span>任务中心</span>
        </el-menu-item>
        <el-menu-item index="/rag">
          <el-icon><Search /></el-icon>
          <span>RAG 问答</span>
        </el-menu-item>
        <el-menu-item index="/chat">
          <el-icon><ChatDotRound /></el-icon>
          <span>AI 聊天</span>
        </el-menu-item>
        <el-menu-item index="/langchain4j">
          <el-icon><Share /></el-icon>
          <span>LangChain4j</span>
        </el-menu-item>
        <el-menu-item index="/context">
          <el-icon><Clock /></el-icon>
          <span>上下文管理</span>
        </el-menu-item>
        <el-menu-item index="/monitor">
          <el-icon><Monitor /></el-icon>
          <span>系统监控</span>
        </el-menu-item>
        <el-menu-item v-if="auth.roleCode === 'ADMIN'" index="/users">
          <el-icon><UserFilled /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/student">
          <el-icon><User /></el-icon>
          <span>学生信息</span>
        </el-menu-item>
        <el-menu-item index="/model-config">
          <el-icon><Setting /></el-icon>
          <span>模型配置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="topbar">
        <div>
          <div class="top-title">{{ $route.meta.title || 'QS-AI Admin' }}</div>
          <div class="top-subtitle">Spring Boot 3.2.5 AI 后端控制台</div>
        </div>
        <div class="top-actions">
          <el-tag effect="plain">{{ auth.username || 'admin' }}</el-tag>
          <el-tag v-if="auth.roleCode" effect="plain" type="info">{{ auth.roleCode }}</el-tag>
          <el-button :icon="SwitchButton" @click="logout">退出</el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  ChatDotRound,
  Clock,
  DataBoard,
  Files,
  Monitor,
  Operation,
  Search,
  Setting,
  Share,
  SwitchButton,
  User,
  UserFilled
} from '@element-plus/icons-vue'

const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.clearSession()
  router.push('/login')
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
}

.sidebar {
  border-right: 1px solid #e5e7eb;
  background: #ffffff;
  overflow: auto;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 72px;
  padding: 0 18px;
  border-bottom: 1px solid #eef2f7;
}

.brand-mark {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 8px;
  background: #1d4ed8;
  color: #fff;
  font-weight: 800;
}

.brand-title {
  color: #111827;
  font-weight: 700;
}

.brand-subtitle,
.top-subtitle {
  color: #64748b;
  font-size: 12px;
}

.nav-menu {
  border-right: none;
  padding: 10px;
}

.nav-menu :deep(.el-menu-item) {
  border-radius: 8px;
  margin-bottom: 4px;
}

.nav-menu :deep(.el-menu-item.is-active) {
  background: #eff6ff;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.top-title {
  color: #111827;
  font-size: 17px;
  font-weight: 700;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.main {
  background: #f5f7fb;
  padding: 20px;
}
</style>
