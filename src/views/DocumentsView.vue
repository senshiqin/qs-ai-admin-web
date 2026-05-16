<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">文档管理</h1>
        <p class="page-subtitle">查询、批量上传、异步向量化和删除知识库文档</p>
      </div>
      <div class="toolbar">
        <el-button :icon="Upload" type="primary" @click="uploadDialog = true">批量上传</el-button>
        <el-button :icon="Refresh" @click="load">刷新</el-button>
      </div>
    </div>

    <div class="panel">
      <el-form :model="query" inline>
        <el-form-item label="知识库">
          <el-input v-model="query.kbCode" clearable placeholder="default" />
        </el-form-item>
        <el-form-item label="文件名">
          <el-input v-model="query.fileName" clearable placeholder="关键词" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="query.fileType" clearable placeholder="全部" style="width: 120px">
            <el-option label="PDF" value="pdf" />
            <el-option label="DOCX" value="docx" />
            <el-option label="TXT" value="txt" />
            <el-option label="MD" value="md" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.parseStatus" clearable placeholder="全部" style="width: 130px">
            <el-option :value="0" label="待处理" />
            <el-option :value="1" label="处理中" />
            <el-option :value="2" label="成功" />
            <el-option :value="3" label="失败" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="createdRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="search">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="page.records" border empty-text="暂无文档">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="fileName" label="文件名" min-width="220" show-overflow-tooltip />
        <el-table-column prop="kbCode" label="知识库" width="120" />
        <el-table-column prop="fileType" label="类型" width="90" />
        <el-table-column label="大小" width="110">
          <template #default="{ row }">{{ formatFileSize(row.fileSize) }}</template>
        </el-table-column>
        <el-table-column prop="chunkCount" label="切片" width="90" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="documentStatusType(row.parseStatus)" effect="plain">
              {{ documentStatusText(row.parseStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="任务状态" width="120">
          <template #default="{ row }">
            <el-tag v-if="taskByFileId[row.id]" :type="taskStatusType(taskByFileId[row.id].status)" effect="plain">
              {{ taskStatusText(taskByFileId[row.id].status) }}
            </el-tag>
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="进度" min-width="150">
          <template #default="{ row }">
            <el-progress
              v-if="taskByFileId[row.id]"
              :percentage="taskByFileId[row.id].progressPercent || 0"
              :status="taskProgressStatus(taskByFileId[row.id].status)"
            />
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="当前步骤" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ taskByFileId[row.id]?.currentStep || '-' }}</template>
        </el-table-column>
        <el-table-column label="耗时" width="100">
          <template #default="{ row }">{{ formatDuration(taskByFileId[row.id]?.durationMs) }}</template>
        </el-table-column>
        <el-table-column label="失败原因" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ taskByFileId[row.id]?.errorMessage || '-' }}</template>
        </el-table-column>
        <el-table-column prop="embeddingModel" label="Embedding" min-width="180" show-overflow-tooltip />
        <el-table-column label="创建时间" min-width="170">
          <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showDetail(row.id)">详情</el-button>
            <el-button
              v-if="taskByFileId[row.id]?.status === 'FAILED'"
              link
              type="warning"
              :loading="retryingTaskId === taskByFileId[row.id]?.id"
              @click="retryTask(taskByFileId[row.id].id)"
            >
              重试
            </el-button>
            <el-popconfirm title="确定删除该文档和向量吗？" @confirm="remove(row.id)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
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

    <el-dialog v-model="uploadDialog" title="批量上传文档" width="560px">
      <el-form label-width="92px">
        <el-form-item label="知识库">
          <el-input v-model="uploadForm.kbCode" />
        </el-form-item>
        <el-form-item label="切片大小">
          <el-input-number v-model="uploadForm.chunkSize" :min="100" :step="100" />
        </el-form-item>
        <el-form-item label="重叠比例">
          <el-input-number v-model="uploadForm.overlapRatio" :min="0" :max="0.5" :step="0.05" />
        </el-form-item>
        <el-form-item label="异步入库">
          <el-switch v-model="uploadForm.async" />
        </el-form-item>
        <el-form-item label="文件">
          <el-upload
            v-model:file-list="fileList"
            drag
            multiple
            :limit="10"
            :auto-upload="false"
            :on-exceed="handleExceed"
            accept=".pdf,.docx,.txt,.md"
          >
            <el-icon><UploadFilled /></el-icon>
            <div>拖拽文件到这里或点击选择</div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialog = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="submitUpload">提交</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="uploadResultVisible" title="上传任务结果" size="640px">
      <el-table :data="uploadResults" border empty-text="暂无上传结果">
        <el-table-column prop="fileName" label="文件名" min-width="180" show-overflow-tooltip />
        <el-table-column prop="taskId" label="Task ID" width="110">
          <template #default="{ row }">{{ row.taskId || '-' }}</template>
        </el-table-column>
        <el-table-column prop="fileId" label="File ID" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="documentStatusType(row.parseStatus)" effect="plain">
              {{ documentStatusText(row.parseStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="chunkCount" label="切片" width="80" />
        <el-table-column prop="embeddingModel" label="Embedding" min-width="160" show-overflow-tooltip />
      </el-table>
    </el-drawer>

    <el-drawer v-model="detailVisible" title="文档详情" size="560px">
      <div v-loading="detailLoading" class="detail-body">
        <el-descriptions v-if="detail" :column="1" border>
          <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
          <el-descriptions-item label="文件名">{{ detail.fileName }}</el-descriptions-item>
          <el-descriptions-item label="知识库">{{ detail.kbCode }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ detail.fileType }}</el-descriptions-item>
          <el-descriptions-item label="大小">{{ formatFileSize(detail.fileSize) }}</el-descriptions-item>
          <el-descriptions-item label="文件 Hash">{{ detail.fileHash || '-' }}</el-descriptions-item>
          <el-descriptions-item label="路径">{{ detail.storagePath }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="documentStatusType(detail.parseStatus)" effect="plain">
              {{ documentStatusText(detail.parseStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="切片数量">{{ detail.chunkCount }}</el-descriptions-item>
          <el-descriptions-item label="Embedding">{{ detail.embeddingModel || '-' }}</el-descriptions-item>
          <el-descriptions-item label="向量索引">{{ detail.vectorIndexName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="上传用户">{{ detail.uploaderUserId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="最后解析">{{ formatDateTime(detail.lastParseTime) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(detail.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDateTime(detail.updateTime) }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ detail.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
        <el-empty v-else-if="!detailLoading" description="暂无详情" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import type { UploadUserFile } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Refresh, Search, Upload, UploadFilled } from '@element-plus/icons-vue'
import { batchUploadDocuments, deleteDocument, getDocument, pageDocuments } from '@/api/documents'
import { getRagTask, pageRagTasks, retryRagTask } from '@/api/ragTasks'
import type { DocumentItem, DocumentPage, RagIngestResponse, RagIngestTask, TaskStatus } from '@/types/api'
import {
  documentStatusText,
  documentStatusType,
  formatDateTime,
  formatDuration,
  formatFileSize,
  taskStatusText,
  taskStatusType
} from '@/utils/document'

const loading = ref(false)
const uploading = ref(false)
const detailLoading = ref(false)
const retryingTaskId = ref<number>()
const uploadDialog = ref(false)
const uploadResultVisible = ref(false)
const detailVisible = ref(false)
const detail = ref<DocumentItem>()
const uploadResults = ref<RagIngestResponse[]>([])
const taskByFileId = ref<Record<number, RagIngestTask>>({})
const fileList = ref<UploadUserFile[]>([])
const createdRange = ref<[string, string] | []>([])
let taskPollTimer: ReturnType<typeof window.setInterval> | undefined

const query = reactive({
  pageNo: 1,
  pageSize: 10,
  kbCode: 'default',
  fileName: '',
  fileType: '',
  parseStatus: undefined as number | undefined
})

const page = reactive<DocumentPage>({
  pageNo: 1,
  pageSize: 10,
  total: 0,
  pages: 0,
  records: []
})

const uploadForm = reactive({
  kbCode: 'default',
  chunkSize: 800,
  overlapRatio: 0.15,
  async: true
})

async function load() {
  loading.value = true
  try {
    const [createdFrom, createdTo] = createdRange.value
    const response = await pageDocuments({
      ...query,
      createdFrom,
      createdTo
    })
    Object.assign(page, response.data)
    await loadTasksForCurrentPage()
  } finally {
    loading.value = false
  }
}

async function loadTasksForCurrentPage() {
  if (!page.records.length) {
    taskByFileId.value = {}
    return
  }
  const response = await pageRagTasks({
    pageNo: 1,
    pageSize: 100,
    kbCode: query.kbCode || undefined
  })
  const fileIds = new Set(page.records.map((item) => item.id))
  const next: Record<number, RagIngestTask> = {}
  response.data.records.forEach((task) => {
    if (!fileIds.has(task.knowledgeFileId)) return
    const existing = next[task.knowledgeFileId]
    if (!existing || task.id > existing.id) next[task.knowledgeFileId] = task
  })
  taskByFileId.value = next
}

function search() {
  query.pageNo = 1
  load()
}

function resetQuery() {
  Object.assign(query, {
    pageNo: 1,
    pageSize: 10,
    kbCode: 'default',
    fileName: '',
    fileType: '',
    parseStatus: undefined
  })
  createdRange.value = []
  load()
}

async function showDetail(id: number) {
  detail.value = undefined
  detailVisible.value = true
  detailLoading.value = true
  try {
    const response = await getDocument(id)
    detail.value = response.data
  } finally {
    detailLoading.value = false
  }
}

async function remove(id: number) {
  await deleteDocument(id)
  ElMessage.success('删除成功')
  await load()
}

async function submitUpload() {
  const files = fileList.value.map((item) => item.raw).filter(Boolean) as File[]
  if (!files.length) {
    ElMessage.warning('请选择文件')
    return
  }
  uploading.value = true
  try {
    const response = await batchUploadDocuments({ ...uploadForm, files })
    uploadResults.value = response.data.files || []
    ElMessage.success(
      response.data.async
        ? `已提交 ${response.data.submittedCount} 个文件，后台异步处理中`
        : `已完成 ${response.data.submittedCount} 个文件入库`
    )
    uploadDialog.value = false
    uploadResultVisible.value = uploadResults.value.length > 0
    fileList.value = []
    await load()
    await refreshSubmittedTasks()
  } finally {
    uploading.value = false
  }
}

function handleExceed() {
  ElMessage.warning('一次最多上传 10 个文件')
}

async function refreshSubmittedTasks() {
  const taskIds = uploadResults.value.map((item) => item.taskId).filter(Boolean) as number[]
  await Promise.all(taskIds.map((taskId) => refreshTask(taskId)))
}

async function refreshTask(taskId: number) {
  const response = await getRagTask(taskId)
  const task = response.data
  if (task.knowledgeFileId) {
    taskByFileId.value = {
      ...taskByFileId.value,
      [task.knowledgeFileId]: task
    }
  }
}

async function retryTask(taskId: number) {
  retryingTaskId.value = taskId
  try {
    const response = await retryRagTask(taskId)
    ElMessage.success(`重试任务已提交，taskId=${response.data.taskId || taskId}`)
    await refreshTask(response.data.taskId || taskId)
  } finally {
    retryingTaskId.value = undefined
  }
}

function taskProgressStatus(status?: TaskStatus) {
  if (status === 'SUCCESS') return 'success'
  if (status === 'FAILED') return 'exception'
  return undefined
}

function startTaskPolling() {
  stopTaskPolling()
  taskPollTimer = window.setInterval(async () => {
    const runningTasks = Object.values(taskByFileId.value).filter(
      (task) => task.status === 'PENDING' || task.status === 'RUNNING'
    )
    if (!runningTasks.length) return
    await Promise.all(runningTasks.map((task) => refreshTask(task.id)))
  }, 3000)
}

function stopTaskPolling() {
  if (taskPollTimer) window.clearInterval(taskPollTimer)
  taskPollTimer = undefined
}

onMounted(() => {
  load()
  startTaskPolling()
})

onBeforeUnmount(stopTaskPolling)
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 14px;
}

.detail-body {
  min-height: 240px;
}
</style>
