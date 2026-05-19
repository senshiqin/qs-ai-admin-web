<template>
  <main class="login-page">
    <section class="login-panel">
      <div class="login-copy">
        <h1>QS-AI Admin</h1>
        <p>面向多模型聊天、RAG 知识库和 LangChain4j 链路调试的 AI 后台工作台。</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" class="login-form" @keyup.enter="submit">
        <el-segmented v-model="mode" :options="modeOptions" block class="mode-switch" />
        <h2>{{ mode === 'login' ? '登录' : '注册' }}</h2>

        <el-form-item prop="username">
          <el-input v-model="form.username" size="large" placeholder="用户名" :prefix-icon="User" />
        </el-form-item>
        <el-form-item v-if="mode === 'register'" prop="nickname">
          <el-input v-model="form.nickname" size="large" placeholder="昵称（可选）" :prefix-icon="User" />
        </el-form-item>
        <el-form-item v-if="mode === 'register'" prop="email">
          <el-input v-model="form.email" size="large" placeholder="邮箱（可选）" :prefix-icon="Message" />
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
        <el-form-item v-if="mode === 'register'" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            size="large"
            placeholder="确认密码"
            show-password
            :prefix-icon="Lock"
          />
        </el-form-item>

        <el-button type="primary" size="large" :loading="loading" class="login-button" @click="submit">
          {{ mode === 'login' ? '登录' : '注册并登录' }}
        </el-button>
      </el-form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Lock, Message, User } from '@element-plus/icons-vue'
import { login, register } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import type { LoginResponse } from '@/types/api'

type AuthMode = 'login' | 'register'

const router = useRouter()
const auth = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const mode = ref<AuthMode>('login')
const modeOptions = [
  { label: '登录', value: 'login' },
  { label: '注册', value: 'register' }
]

const form = reactive({
  username: 'admin',
  password: '123456',
  confirmPassword: '',
  nickname: '',
  email: ''
})

const rules = computed<FormRules>(() => ({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    {
      pattern: /^[A-Za-z0-9_]{4,32}$/,
      message: '用户名需为 4-32 位字母、数字或下划线',
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 64, message: '密码长度需为 6-64 位', trigger: 'blur' }
  ],
  confirmPassword:
    mode.value === 'register'
      ? [
          { required: true, message: '请再次输入密码', trigger: 'blur' },
          {
            validator: (_rule, value, callback) => {
              if (value !== form.password) callback(new Error('两次输入的密码不一致'))
              else callback()
            },
            trigger: 'blur'
          }
        ]
      : [],
  email:
    mode.value === 'register'
      ? [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }]
      : []
}))

async function submit() {
  await formRef.value?.validate()
  loading.value = true
  try {
    const response =
      mode.value === 'login'
        ? await login(form.username, form.password)
        : await register({
            username: form.username,
            password: form.password,
            nickname: form.nickname || undefined,
            email: form.email || undefined
          })
    saveSession(response.data)
    ElMessage.success(mode.value === 'login' ? '登录成功' : '注册成功')
    router.push('/dashboard')
  } finally {
    loading.value = false
  }
}

function saveSession(data: LoginResponse) {
  const token = data.tokenType ? `${data.tokenType} ${data.accessToken}` : `Bearer ${data.accessToken}`
  auth.setSession(token, data.username || form.username, data.refreshToken, data.roleCode)
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
  min-height: 500px;
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

.mode-switch {
  margin-bottom: 24px;
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
