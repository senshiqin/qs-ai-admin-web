<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">AI 聊天</h1>
        <p class="page-subtitle">普通对话和 SSE 流式输出调试</p>
      </div>
      <div class="toolbar">
        <el-button :icon="Plus" @click="newConversation">新会话</el-button>
        <el-button :icon="Delete" :disabled="loading || messages.length === 0" @click="clearMessages">清空</el-button>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="8">
        <div class="panel">
          <el-form label-position="top">
            <el-form-item label="Conversation ID">
              <el-input v-model="form.conversationId" />
            </el-form-item>
            <el-form-item label="问答模式">
              <el-switch
                v-model="ragMode"
                active-text="知识库问答"
                inactive-text="普通聊天"
                inline-prompt
                :active-icon="Collection"
                :inactive-icon="ChatDotRound"
              />
            </el-form-item>
            <el-form-item label="Provider">
              <el-select
                v-model="form.provider"
                clearable
                filterable
                :loading="modelConfigLoading"
                placeholder="默认"
                @change="handleProviderChange"
              >
                <el-option
                  v-for="option in providerOptions"
                  :key="option.key"
                  :label="option.label"
                  :value="option.value"
                  :disabled="!option.enabled"
                >
                  <div class="provider-option">
                    <span>{{ option.label }}</span>
                    <span class="muted">{{ option.defaultModel || '未设置默认模型' }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="Model">
              <el-input v-model="form.model" clearable placeholder="默认模型">
                <template #append>
                  <el-tooltip content="填入默认模型">
                    <el-button :icon="MagicStick" @click="fillDefaultModel()" />
                  </el-tooltip>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="Temperature">
              <el-slider v-model="form.temperature" :min="0" :max="2" :step="0.1" show-input />
            </el-form-item>
            <el-row v-if="ragMode" :gutter="10">
              <el-col :span="12">
                <el-form-item label="TopK">
                  <el-input-number v-model="ragForm.topK" :min="1" :max="20" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="MinScore">
                  <el-input-number v-model="ragForm.minScore" :min="0" :max="1" :step="0.05" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="输入">
              <el-input v-model="input" type="textarea" :rows="6" />
            </el-form-item>
            <div class="toolbar">
              <el-button type="primary" :icon="Promotion" :loading="loading" @click="send(false)">
                发送
              </el-button>
              <el-button :icon="Connection" :loading="loading" @click="send(true)">
                {{ ragMode ? 'RAG 流式' : '流式' }}
              </el-button>
            </div>
          </el-form>
        </div>
      </el-col>
      <el-col :xs="24" :lg="16">
        <div ref="chatPanelRef" class="panel chat-panel">
          <div v-if="messages.length === 0" class="empty muted">暂无消息</div>
          <div v-for="(message, index) in messages" :key="index" :class="['bubble', message.role]">
            <div class="role">{{ roleText(message.role) }}</div>
            <div class="content">{{ message.content }}</div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  ChatDotRound,
  Collection,
  Connection,
  Delete,
  MagicStick,
  Plus,
  Promotion
} from '@element-plus/icons-vue'
import { sendChat, streamChat } from '@/api/chat'
import { streamRagAnswer } from '@/api/rag'
import type { ChatMessage } from '@/types/api'
import { useModelConfigOptions } from '@/composables/useModelConfigOptions'

const loading = ref(false)
const ragMode = ref(false)
const input = ref('你好，请介绍一下当前项目的多模型能力')
const messages = ref<ChatMessage[]>([])
const chatPanelRef = ref<HTMLElement>()
const { modelConfigLoading, providerOptions, loadModelConfigOptions, resolveDefaultModel } = useModelConfigOptions()
const form = reactive({
  conversationId: `web-${Date.now()}`,
  provider: 'QWEN',
  model: '',
  temperature: 0.7
})
const ragForm = reactive({
  topK: 5,
  minScore: 0.55
})

async function send(stream: boolean) {
  if (loading.value) return
  if (!input.value.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }
  const userMessage: ChatMessage = { role: 'user', content: input.value.trim() }
  messages.value.push(userMessage)
  input.value = ''
  await scrollToBottom()
  loading.value = true
  try {
    if (ragMode.value) {
      await sendRagMessage(userMessage.content)
    } else if (stream) {
      await sendStreamMessage()
    } else {
      const response = await sendChat({
        ...form,
        messages: messages.value
      })
      form.conversationId = response.data.conversationId
      messages.value.push({ role: 'assistant', content: response.data.answer })
      await scrollToBottom()
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '发送失败')
  } finally {
    loading.value = false
  }
}

async function sendStreamMessage() {
  const assistantIndex = appendAssistant()
  await streamChat(
    {
      ...form,
      messages: messages.value.filter((item) => item.content)
    },
    (text) => appendAssistantContent(assistantIndex, text),
    () => ElMessage.success('流式回复完成')
  )
}

async function sendRagMessage(queryText: string) {
  const assistantIndex = appendAssistant()
  await streamRagAnswer(
    {
      queryText,
      provider: form.provider,
      model: form.model,
      temperature: form.temperature,
      topK: ragForm.topK,
      minScore: ragForm.minScore
    },
    {
      onMessage: (text) => appendAssistantContent(assistantIndex, text),
      onResult: (data) => {
        const result = data as { answer?: string }
        const assistant = messages.value[assistantIndex]
        if (assistant && !assistant.content && result.answer) {
          messages.value[assistantIndex] = {
            ...assistant,
            content: result.answer
          }
          scrollToBottom()
        }
      },
      onDone: () => ElMessage.success('知识库问答完成'),
      onError: (message) => {
        throw new Error(message)
      }
    }
  )
}

function appendAssistant() {
  const assistantIndex = messages.value.length
  messages.value.push({ role: 'assistant', content: '' })
  scrollToBottom()
  return assistantIndex
}

function appendAssistantContent(index: number, text: string) {
  const assistant = messages.value[index]
  if (!assistant) return
  messages.value[index] = {
    ...assistant,
    content: assistant.content + text
  }
  scrollToBottom()
}

function clearMessages() {
  messages.value = []
}

function newConversation() {
  messages.value = []
  input.value = '你好，请介绍一下当前项目的多模型能力'
  form.conversationId = `web-${Date.now()}`
}

function handleProviderChange() {
  fillDefaultModel(false)
}

function fillDefaultModel(showMessage = true) {
  const defaultModel = resolveDefaultModel(form.provider)
  if (defaultModel) {
    form.model = defaultModel
    return
  }
  form.model = ''
  if (showMessage) ElMessage.info('当前供应商没有默认模型')
}

function roleText(role: ChatMessage['role']) {
  if (role === 'user') return '用户'
  if (role === 'assistant') return '助手'
  return '系统'
}

async function scrollToBottom() {
  await nextTick()
  const el = chatPanelRef.value
  if (el) el.scrollTop = el.scrollHeight
}

onMounted(async () => {
  try {
    await loadModelConfigOptions()
    fillDefaultModel(false)
  } catch {
    // HTTP interceptor already surfaces the backend error to the user.
  }
})
</script>

<style scoped>
.chat-panel {
  min-height: 620px;
  max-height: 720px;
  overflow: auto;
  scroll-behavior: smooth;
}

.empty {
  display: grid;
  min-height: 540px;
  place-items: center;
}

.bubble {
  margin-bottom: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  background: #fff;
}

.bubble.user {
  background: #eff6ff;
}

.bubble.assistant {
  background: #ffffff;
}

.bubble.system {
  background: #fffbeb;
}

.role {
  margin-bottom: 6px;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.content {
  white-space: pre-wrap;
  line-height: 1.8;
}

.provider-option {
  display: flex;
  min-width: 260px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
</style>
