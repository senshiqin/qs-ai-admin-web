<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">用户管理</h1>
        <p class="page-subtitle">查看系统用户，并为用户分配 ADMIN、USER、VIEWER 角色。</p>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
    </div>

    <div class="panel">
      <el-form :inline="true" :model="query" class="query-form">
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" clearable placeholder="用户名 / 昵称 / 邮箱" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="query.roleCode" clearable placeholder="全部" style="width: 140px">
            <el-option v-for="role in roleOptions" :key="role.value" :label="role.label" :value="role.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部" style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="search">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="records" border empty-text="暂无用户">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" min-width="140" />
        <el-table-column prop="nickname" label="昵称" min-width="140" />
        <el-table-column prop="email" label="邮箱" min-width="200" show-overflow-tooltip />
        <el-table-column prop="roleCode" label="角色" width="180">
          <template #default="{ row }">
            <el-select
              v-model="row.roleCode"
              size="small"
              :disabled="isSelf(row)"
              @change="(value: UserRoleCode) => changeRole(row, value)"
            >
              <el-option v-for="role in roleOptions" :key="role.value" :label="role.label" :value="role.value" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="plain">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="userPoints" label="积分" width="90" />
        <el-table-column label="最近登录" min-width="180">
          <template #default="{ row }">{{ formatDateTime(row.lastLoginTime) }}</template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="180">
          <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <span>Total {{ page.total }}</span>
        <el-pagination
          v-model:current-page="page.pageNo"
          v-model:page-size="page.pageSize"
          layout="sizes, prev, pager, next"
          :page-sizes="[10, 20, 50, 100]"
          :total="page.total"
          @current-change="load"
          @size-change="search"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import { getUsers, updateUserRole } from '@/api/users'
import { useAuthStore } from '@/stores/auth'
import type { UserItem, UserRoleCode } from '@/types/api'
import { formatDateTime } from '@/utils/document'

const auth = useAuthStore()
const loading = ref(false)
const records = ref<UserItem[]>([])
const query = reactive<{
  keyword: string
  roleCode: string
  status?: number
}>({
  keyword: '',
  roleCode: '',
  status: undefined
})
const page = reactive({
  pageNo: 1,
  pageSize: 10,
  total: 0
})
const roleOptions: Array<{ label: string; value: UserRoleCode }> = [
  { label: '管理员', value: 'ADMIN' },
  { label: '普通用户', value: 'USER' },
  { label: '只读用户', value: 'VIEWER' }
]

async function load() {
  loading.value = true
  try {
    const response = await getUsers({
      pageNo: page.pageNo,
      pageSize: page.pageSize,
      keyword: query.keyword || undefined,
      roleCode: query.roleCode || undefined,
      status: query.status
    })
    records.value = response.data.records
    page.total = response.data.total
  } finally {
    loading.value = false
  }
}

function search() {
  page.pageNo = 1
  load()
}

function reset() {
  query.keyword = ''
  query.roleCode = ''
  query.status = undefined
  search()
}

async function changeRole(row: UserItem, roleCode: UserRoleCode) {
  const oldRole = records.value.find((item) => item.id === row.id)?.roleCode
  try {
    const response = await updateUserRole(row.id, roleCode)
    Object.assign(row, response.data)
    ElMessage.success('角色已更新')
  } catch (error) {
    if (oldRole) row.roleCode = oldRole
    throw error
  }
}

function isSelf(row: UserItem) {
  return row.username === auth.username
}

onMounted(load)
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  margin: 0;
  color: #111827;
  font-size: 24px;
}

.page-subtitle {
  margin: 6px 0 0;
  color: #64748b;
}

.panel {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  padding: 18px;
}

.query-form {
  margin-bottom: 8px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  color: #475569;
}
</style>
