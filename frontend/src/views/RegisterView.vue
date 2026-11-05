<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '../api/auth'
import ErrorState from '../components/ErrorState.vue'
import { toast } from '../composables/useToast'

const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref<any>(null)
const loading = ref(false)

const passwordStrength = computed(() => {
  if (!password.value) return { text: '', color: '' }
  if (password.value.length < 6) return { text: '密码太短（至少 6 位）', color: 'red' }
  if (password.value.length < 10) return { text: '中等强度', color: 'orange' }
  return { text: '强密码', color: 'green' }
})

async function handleRegister() {
  if (passwordStrength.value.color === 'red') return

  loading.value = true
  error.value = null

  try {
    await authApi.register({
      name: name.value,
      email: email.value,
      password: password.value,
    })

    toast('注册成功，请登录', 'success')
    router.push('/login')
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
        <p class="eyebrow">后台初始化</p>
        <h1>注册管理员</h1>
      </div>

      <ErrorState v-if="error" :error="error" />

      <el-form class="auth-form" @submit.prevent="handleRegister" label-position="top">
        <el-form-item label="昵称（可选）">
          <el-input v-model="name" type="text" placeholder="你的名字" clearable />
        </el-form-item>

        <el-form-item label="邮箱">
          <el-input v-model="email" type="email" placeholder="admin@example.com" clearable />
        </el-form-item>

        <el-form-item label="密码">
          <el-input v-model="password" type="password" placeholder="至少 6 位" show-password />
          <small v-if="password" :style="{ color: passwordStrength.color }">
            {{ passwordStrength.text }}
          </small>
        </el-form-item>

        <el-button type="primary" native-type="submit" :loading="loading" block>
          {{ loading ? '注册中...' : '注册' }}
        </el-button>
      </el-form>

      <p class="switch-link">已有账号？ <RouterLink to="/login">去登录</RouterLink></p>
    </el-card>
  </div>
</template>
