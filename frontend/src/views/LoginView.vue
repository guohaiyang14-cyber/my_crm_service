<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '../api/auth'
import ErrorState from '../components/ErrorState.vue'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref<any>(null)
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  error.value = null

  try {
    const res = await authApi.login({ email: email.value, password: password.value })

    localStorage.setItem('auth_token', res.data.token)
    localStorage.setItem('auth_user', JSON.stringify(res.data.user))
    router.push('/')
  } catch (err: any) {
    error.value = err
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-shell">
    <el-card shadow="hover" class="auth-card">
      <div class="auth-header">
        <p class="eyebrow">管理员入口</p>
        <h1>登录</h1>
      </div>

      <ErrorState v-if="error" :error="error" />

      <el-form class="auth-form" @submit.prevent="handleLogin" label-position="top">
        <el-form-item label="邮箱">
          <el-input v-model="email" type="email" placeholder="admin@example.com" clearable />
        </el-form-item>

        <el-form-item label="密码">
          <el-input v-model="password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>

        <el-button type="primary" native-type="submit" :loading="loading" class="submit-btn" block>
          {{ loading ? '登录中...' : '登录' }}
        </el-button>
      </el-form>

      <p class="switch-link">还没有账号？ <RouterLink to="/register">去注册</RouterLink></p>
    </el-card>
  </div>
</template>
