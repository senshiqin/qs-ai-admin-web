<template>
  <main class="login-page">
    <section class="login-panel">
      <div class="login-copy">
        <h1>QS-AI Admin</h1>
        <p>面向多模型聊天、RAG 知识库和 LangChain4j 链路调试的企业后台。</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" class="login-form" @keyup.enter="submit">
        <h2>登录</h2>
        <el-form-item prop="username">
          <el-input v-model="form.username" size="large" placeholder="用户名" :prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            size="large"
            placeholder="密码"
            show-password
            :prefix-icon="Lock"
          />
        </el-form-item>
        <el-button type="primary" size="large" :loading="loading" class="login-button" @click="submit">
          登录
        </el-button>
      </el-form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Lock, User } from '@element-plus/icons-vue'
import { login } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({ username: 'admin', password: '123456' })

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function submit() {
  await formRef.value?.validate()
  loading.value = true
  try {
    const response = await login(form.username, form.password)
    const token = response.data.tokenType
      ? `${response.data.tokenType} ${response.data.accessToken}`
      : `Bearer ${response.data.accessToken}`
    auth.setSession(
      token,
      response.data.username || form.username,
      response.data.refreshToken,
      response.data.roleCode
    )
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  background:
    linear-gradient(rgba(15, 23, 42, 0.38), rgba(15, 23, 42, 0.3)),
    url("https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1800&q=80")
      center/cover;
  padding: 24px;
}

.login-panel {
  display: grid;
  width: min(920px, 100%);
  grid-template-columns: 1.1fr 380px;
  min-height: 460px;
  overflow: hidden;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.25);
}

.login-copy {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 42px;
  background: #172033;
  color: #fff;
}

.login-copy h1 {
  margin: 0;
  font-size: 42px;
  letter-spacing: 0;
}

.login-copy p {
  max-width: 420px;
  color: #cbd5e1;
  line-height: 1.8;
}

.login-form {
  align-self: center;
  padding: 42px;
}

.login-form h2 {
  margin: 0 0 28px;
  color: #111827;
}

.login-button {
  width: 100%;
}

@media (max-width: 760px) {
  .login-panel {
    grid-template-columns: 1fr;
  }

  .login-copy {
    min-height: 210px;
  }
}
</style>
