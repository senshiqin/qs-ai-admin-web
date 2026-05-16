<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">上下文管理</h1>
        <p class="page-subtitle">查看、写入和清空 Redis 中的会话上下文</p>
      </div>
      <div class="toolbar">
        <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
        <el-popconfirm title="确定清空当前会话上下文吗？" @confirm="clearMessages">
          <template #reference>
            <el-button :icon="Delete" type="danger" plain :disabled="!messages.length">清空上下文</el-button>
          </template>
        </el-popconfirm>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="8">
        <div class="panel">
          <el-form label-position="top">
            <el-form-item label="User ID">
              <el-input-number v-model="query.userId" :min="0" />
            </el-form-item>
            <el-form-item label="Conversation ID">
              <el-input v-model="query.conversationId" clearable />
            </el-form-item>
            <el-button type="primary" :icon="Search" :loading="loading" @click="load">查询上下文</el-button>
          </el-form>
        </div>

        <div class="panel">
          <h3>追加上下文</h3>
          <el-form label-position="top">
            <el-form-item label="Role">
              <el-segmented v-model="addForm.role" :options="roleOptions" />
            </el-form-item>
            <el-form-item label="Content">
              <el-input v-model="addForm.content" type="textarea" :rows="7" />
            </el-form-item>
            <el-button type="primary" :icon="Plus" :loading="adding" @click="addMessage">追加消息</el-button>
          </el-form>
        </div>
      </el-col>

      <el-col :xs="24" :lg="16">
        <div class="panel context-panel">
          <div class="context-head">
            <h3>当前上下文</h3>
            <el-tag effect="plain">{{ messages.length }} 条</el-tag>
          </div>

          <el-empty v-if="!loading && messages.length === 0" description="暂无上下文消息" />
          <el-timeline v-else>
            <el-timeline-item
              v-for="(message, index) in messages"
              :key="`${message.role}-${index}-${message.timestamp || ''}`"
              :timestamp="formatDateTime(message.timestamp)"
              :type="timelineType(message.role)"
            >
              <div :class="['context-card', message.role]">
                <div class="context-role">{{ roleText(message.role) }}</div>
                <div class="context-content">{{ message.content }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { addContextMessage, clearContextMessages, listContextMessages } from '@/api/context'
import type { ChatContextMessage } from '@/types/api'
import { formatDateTime } from '@/utils/document'

const loading = ref(false)
const adding = ref(false)
const messages = ref<ChatContextMessage[]>([])

const query = reactive({
  userId: 1,
  conversationId: 'conv-001'
})

const addForm = reactive<{
  role: ChatContextMessage['role']
  content: string
}>({
  role: 'user',
  content: '请记住：这是一条用于 Redis 上下文联调的测试消息。'
})

const roleOptions = [
  { label: '用户', value: 'user' },
  { label: '助手', value: 'assistant' },
  { label: '系统', value: 'system' }
]

async function load() {
  if (!validateQuery()) return
  loading.value = true
  try {
    const response = await listContextMessages({
      userId: query.userId,
      conversationId: query.conversationId.trim()
    })
    messages.value = response.data || []
  } finally {
    loading.value = false
  }
}

async function addMessage() {
  if (!validateQuery()) return
  if (!addForm.content.trim()) {
    ElMessage.warning('请输入上下文内容')
    return
  }
  adding.value = true
  try {
    await addContextMessage({
      userId: query.userId,
      conversationId: query.conversationId.trim(),
      role: addForm.role,
      content: addForm.content.trim()
    })
    ElMessage.success('上下文已追加')
    addForm.content = ''
    await load()
  } finally {
    adding.value = false
  }
}

async function clearMessages() {
  if (!validateQuery()) return
  await clearContextMessages({
    userId: query.userId,
    conversationId: query.conversationId.trim()
  })
  ElMessage.success('上下文已清空')
  await load()
}

function validateQuery() {
  if (!query.conversationId.trim()) {
    ElMessage.warning('请输入 Conversation ID')
    return false
  }
  return true
}

function roleText(role: ChatContextMessage['role']) {
  if (role === 'assistant') return '助手'
  if (role === 'system') return '系统'
  return '用户'
}

function timelineType(role: ChatContextMessage['role']) {
  if (role === 'assistant') return 'primary'
  if (role === 'system') return 'warning'
  return 'success'
}

onMounted(load)
</script>

<style scoped>
h3 {
  margin: 0 0 14px;
}

.context-panel {
  min-height: 620px;
}

.context-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.context-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  padding: 12px;
}

.context-card.user {
  background: #eff6ff;
}

.context-card.system {
  background: #fffbeb;
}

.context-role {
  margin-bottom: 6px;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
}

.context-content {
  white-space: pre-wrap;
  line-height: 1.8;
}
</style>
