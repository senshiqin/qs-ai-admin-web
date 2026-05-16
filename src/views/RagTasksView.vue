<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">任务中心</h1>
        <p class="page-subtitle">跟踪 RAG 文档解析、切片、向量化和入库进度</p>
      </div>
      <div class="toolbar">
        <el-switch v-model="autoRefresh" active-text="自动刷新" />
        <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
      </div>
    </div>

    <div class="panel">
      <el-form :model="query" inline>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部" style="width: 150px">
            <el-option label="等待中" value="PENDING" />
            <el-option label="运行中" value="RUNNING" />
            <el-option label="成功" value="SUCCESS" />
            <el-option label="失败" value="FAILED" />
          </el-select>
        </el-form-item>
        <el-form-item label="知识库">
          <el-input v-model="query.kbCode" clearable placeholder="default" />
        </el-form-item>
        <el-form-item label="File ID">
          <el-input-number v-model="fileIdInput" :min="1" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="search">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="page.records" border empty-text="暂无任务">
        <el-table-column prop="id" label="Task ID" width="90" />
        <el-table-column prop="taskNo" label="任务号" min-width="190" show-overflow-tooltip />
        <el-table-column prop="fileName" label="文件名" min-width="180" show-overflow-tooltip />
        <el-table-column prop="kbCode" label="知识库" width="110" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="taskStatusType(row.status)" effect="plain">{{ taskStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" min-width="160">
          <template #default="{ row }">
            <el-progress :percentage="row.progressPercent || 0" :status="progressStatus(row.status)" />
          </template>
        </el-table-column>
        <el-table-column prop="currentStep" label="当前步骤" min-width="140" show-overflow-tooltip />
        <el-table-column label="重试" width="90">
          <template #default="{ row }">{{ row.retryCount || 0 }} / {{ row.maxRetry || 0 }}</template>
        </el-table-column>
        <el-table-column label="耗时" width="100">
          <template #default="{ row }">{{ formatDuration(row.durationMs) }}</template>
        </el-table-column>
        <el-table-column prop="errorMessage" label="失败原因" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showDetail(row.id)">详情</el-button>
            <el-button
              v-if="row.status === 'FAILED'"
              link
              type="warning"
              :loading="retryingTaskId === row.id"
              @click="retry(row.id)"
            >
              重试
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="query.pageNo"
          v-model:page-size="query.pageSize"
          layout="total, sizes, prev, pager, next"
          :total="page.total"
          :page-sizes="[10, 20, 50, 100]"
          @change="load"
        />
      </div>
    </div>

    <el-drawer v-model="detailVisible" title="任务详情" size="560px">
      <div v-loading="detailLoading" class="detail-body">
        <el-descriptions v-if="detail" :column="1" border>
          <el-descriptions-item label="Task ID">{{ detail.id }}</el-descriptions-item>
          <el-descriptions-item label="任务号">{{ detail.taskNo }}</el-descriptions-item>
          <el-descriptions-item label="File ID">{{ detail.knowledgeFileId }}</el-descriptions-item>
          <el-descriptions-item label="文件名">{{ detail.fileName }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="taskStatusType(detail.status)" effect="plain">{{ taskStatusText(detail.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="进度">
            <el-progress :percentage="detail.progressPercent || 0" :status="progressStatus(detail.status)" />
          </el-descriptions-item>
          <el-descriptions-item label="当前步骤">{{ detail.currentStep || '-' }}</el-descriptions-item>
          <el-descriptions-item label="重试次数">{{ detail.retryCount || 0 }} / {{ detail.maxRetry || 0 }}</el-descriptions-item>
          <el-descriptions-item label="切片参数">
            {{ detail.chunkSize || '-' }} / {{ detail.overlapRatio ?? '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="文本长度">{{ detail.textLength || '-' }}</el-descriptions-item>
          <el-descriptions-item label="切片数量">{{ detail.chunkCount || '-' }}</el-descriptions-item>
          <el-descriptions-item label="入库向量">{{ detail.storedVectorCount || '-' }}</el-descriptions-item>
          <el-descriptions-item label="Embedding">{{ detail.embeddingModel || '-' }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ formatDateTime(detail.startedAt) }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ formatDateTime(detail.finishedAt) }}</el-descriptions-item>
          <el-descriptions-item label="耗时">{{ formatDuration(detail.durationMs) }}</el-descriptions-item>
          <el-descriptions-item label="失败原因">{{ detail.errorMessage || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import { getRagTask, pageRagTasks, retryRagTask } from '@/api/ragTasks'
import type { RagIngestTask, RagIngestTaskPage, TaskStatus } from '@/types/api'
import { formatDateTime, formatDuration, taskStatusText, taskStatusType } from '@/utils/document'

const loading = ref(false)
const detailLoading = ref(false)
const detailVisible = ref(false)
const autoRefresh = ref(true)
const retryingTaskId = ref<number>()
const detail = ref<RagIngestTask>()
const fileIdInput = ref<number>()
let timer: ReturnType<typeof window.setInterval> | undefined

const query = reactive({
  pageNo: 1,
  pageSize: 10,
  status: '' as TaskStatus | '',
  kbCode: 'default'
})

const page = reactive<RagIngestTaskPage>({
  pageNo: 1,
  pageSize: 10,
  total: 0,
  pages: 0,
  records: []
})

async function load() {
  loading.value = true
  try {
    const response = await pageRagTasks({
      ...query,
      fileId: fileIdInput.value
    })
    Object.assign(page, response.data)
  } finally {
    loading.value = false
  }
}

function search() {
  query.pageNo = 1
  load()
}

function reset() {
  Object.assign(query, {
    pageNo: 1,
    pageSize: 10,
    status: '',
    kbCode: 'default'
  })
  fileIdInput.value = undefined
  load()
}

async function showDetail(taskId: number) {
  detailVisible.value = true
  detailLoading.value = true
  try {
    const response = await getRagTask(taskId)
    detail.value = response.data
  } finally {
    detailLoading.value = false
  }
}

async function retry(taskId: number) {
  retryingTaskId.value = taskId
  try {
    const response = await retryRagTask(taskId)
    ElMessage.success(`重试任务已提交，taskId=${response.data.taskId || taskId}`)
    await load()
    if (detailVisible.value) await showDetail(response.data.taskId || taskId)
  } finally {
    retryingTaskId.value = undefined
  }
}

function progressStatus(status: TaskStatus) {
  if (status === 'SUCCESS') return 'success'
  if (status === 'FAILED') return 'exception'
  return undefined
}

function startTimer() {
  stopTimer()
  timer = window.setInterval(() => {
    if (autoRefresh.value && page.records.some((item) => item.status === 'PENDING' || item.status === 'RUNNING')) {
      load()
    }
  }, 3000)
}

function stopTimer() {
  if (timer) window.clearInterval(timer)
  timer = undefined
}

watch(autoRefresh, (enabled) => {
  if (enabled) startTimer()
  else stopTimer()
})

onMounted(() => {
  load()
  startTimer()
})

onBeforeUnmount(stopTimer)
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 14px;
}

.detail-body {
  min-height: 260px;
}
</style>
