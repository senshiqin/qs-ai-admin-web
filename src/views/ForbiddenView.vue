<template>
  <div class="forbidden-page">
    <section class="forbidden-panel">
      <el-result
        icon="warning"
        title="权限不足"
        sub-title="当前账号没有执行该操作的权限，请联系管理员调整角色后再试。"
      >
        <template #extra>
          <div class="meta">
            <el-tag v-if="auth.roleCode" effect="plain">当前角色：{{ auth.roleCode }}</el-tag>
            <el-tag v-if="traceId" effect="plain" type="info">TraceId：{{ traceId }}</el-tag>
          </div>
          <div class="actions">
            <el-button :icon="Back" @click="goBack">返回上一页</el-button>
            <el-button type="primary" :icon="House" @click="router.push('/dashboard')">
              回到仪表盘
            </el-button>
          </div>
        </template>
      </el-result>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Back, House } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const traceId = computed(() => String(route.query.traceId || ''))

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/dashboard')
  }
}
</script>

<style scoped>
.forbidden-page {
  display: grid;
  min-height: calc(100vh - 104px);
  place-items: center;
}

.forbidden-panel {
  width: min(620px, 100%);
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  padding: 18px;
}

.meta,
.actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.actions {
  margin-top: 18px;
}
</style>
