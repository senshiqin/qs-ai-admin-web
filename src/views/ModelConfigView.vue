<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">模型配置</h1>
        <p class="page-subtitle">查看运行时模型配置、供应商状态和热刷新结果</p>
      </div>
      <div class="toolbar">
        <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
        <el-button v-if="canRefresh" type="primary" :icon="Switch" :loading="refreshing" @click="refreshConfig">
          后端热刷新
        </el-button>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="8">
        <div v-loading="loading" class="panel">
          <el-descriptions v-if="config" :column="1" border>
            <el-descriptions-item label="版本">{{ config.version }}</el-descriptions-item>
            <el-descriptions-item label="刷新时间">{{ formatDateTime(config.refreshedAt) }}</el-descriptions-item>
            <el-descriptions-item label="默认供应商">{{ config.defaultProvider }}</el-descriptions-item>
            <el-descriptions-item label="自动刷新">{{ config.autoRefresh ? '开启' : '关闭' }}</el-descriptions-item>
            <el-descriptions-item label="刷新间隔">{{ formatDuration(config.refreshIntervalMs) }}</el-descriptions-item>
            <el-descriptions-item label="兜底策略">
              {{ config.fallbackToDefault ? '启用' : '关闭' }}
            </el-descriptions-item>
            <el-descriptions-item label="外部配置">{{ config.externalFile || '-' }}</el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="暂无模型配置" />
        </div>
      </el-col>
      <el-col :xs="24" :lg="16">
        <div class="panel">
          <h3>模型名前缀路由</h3>
          <el-table :data="routes" border empty-text="暂无路由规则">
            <el-table-column prop="prefix" label="模型前缀" />
            <el-table-column prop="provider" label="路由供应商" />
          </el-table>
        </div>
      </el-col>
    </el-row>

    <div class="panel">
      <h3>供应商</h3>
      <el-table v-loading="loading" :data="config?.providers || []" border empty-text="暂无供应商">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="provider-detail">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="别名">{{ row.aliases?.join(', ') || '-' }}</el-descriptions-item>
                <el-descriptions-item label="Chat Path">{{ row.chatPath || '-' }}</el-descriptions-item>
                <el-descriptions-item label="连接超时">{{ formatDuration(row.connectTimeoutMs) }}</el-descriptions-item>
                <el-descriptions-item label="读取超时">{{ formatDuration(row.readTimeoutMs) }}</el-descriptions-item>
              </el-descriptions>
              <el-descriptions v-if="row.embedding" title="Embedding" :column="2" border>
                <el-descriptions-item label="启用">
                  {{ row.embedding.enabled ? '启用' : '停用' }}
                </el-descriptions-item>
                <el-descriptions-item label="模型">{{ row.embedding.model || '-' }}</el-descriptions-item>
                <el-descriptions-item label="维度">{{ row.embedding.dimensions || '-' }}</el-descriptions-item>
                <el-descriptions-item label="批量大小">{{ row.embedding.batchSize || '-' }}</el-descriptions-item>
                <el-descriptions-item label="路径">{{ row.embedding.path || '-' }}</el-descriptions-item>
              </el-descriptions>
              <el-descriptions v-if="row.ollama" title="Ollama" :column="2" border>
                <el-descriptions-item label="Num Predict">{{ row.ollama.numPredict }}</el-descriptions-item>
                <el-descriptions-item label="Num Ctx">{{ row.ollama.numCtx }}</el-descriptions-item>
                <el-descriptions-item label="Num Thread">{{ row.ollama.numThread || '-' }}</el-descriptions-item>
                <el-descriptions-item label="Keep Alive">{{ row.ollama.keepAlive || '-' }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="displayName" label="名称" min-width="140" />
        <el-table-column prop="key" label="Key" width="110" />
        <el-table-column prop="provider" label="Provider" width="110" />
        <el-table-column prop="enabled" label="启用" width="90">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" effect="plain">
              {{ row.enabled ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="defaultModel" label="默认模型" min-width="180" />
        <el-table-column prop="baseUrl" label="Base URL" min-width="220" show-overflow-tooltip />
        <el-table-column label="API Key" width="100">
          <template #default="{ row }">
            <el-tag :type="row.apiKeyConfigured ? 'success' : 'warning'" effect="plain">
              {{ row.apiKeyConfigured ? '已配置' : '未配置' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="maxInputTokens" label="输入Token" width="120" />
        <el-table-column prop="maxTokens" label="输出Token" width="120" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Switch } from '@element-plus/icons-vue'
import { getModelConfig, refreshModelConfig } from '@/api/modelConfig'
import type { ModelConfigResponse } from '@/types/api'
import { formatDateTime, formatDuration } from '@/utils/document'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const loading = ref(false)
const refreshing = ref(false)
const config = ref<ModelConfigResponse>()
const canRefresh = computed(() => auth.hasPermission('model-config:refresh'))
const routes = computed(() =>
  Object.entries(config.value?.modelPrefixRoutes || {}).map(([prefix, provider]) => ({
    prefix,
    provider
  }))
)

async function load() {
  loading.value = true
  try {
    const response = await getModelConfig()
    config.value = response.data
  } finally {
    loading.value = false
  }
}

async function refreshConfig() {
  refreshing.value = true
  try {
    const response = await refreshModelConfig()
    config.value = response.data
    ElMessage.success('模型配置已刷新')
  } finally {
    refreshing.value = false
  }
}

onMounted(load)
</script>

<style scoped>
h3 {
  margin: 0 0 14px;
}

.provider-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 12px 12px;
}
</style>
