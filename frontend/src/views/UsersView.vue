<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminLayout from './AdminLayout.vue'
import { ApiError, request } from '../api/client'

interface Account { id: number; email: string; name: string | null; role: string; createdAt: string }
const accounts = ref<Account[]>([])
const loading = ref(false)
const saving = ref(false)
const transferring = ref(false)
const transferSource = ref<Account | null>(null)
const transferTargetId = ref<number | null>(null)
const transferTargets = computed(() => accounts.value.filter((account) =>
  account.id !== transferSource.value?.id && ['ADMIN', 'USER'].includes(account.role)
))
const error = ref('')
const form = reactive({ name: '', email: '', password: '' })
const editingId = ref<number | null>(null)
let currentUserId: number | undefined
try { currentUserId = JSON.parse(localStorage.getItem('auth_user') || '{}').id } catch { currentUserId = undefined }

function resetForm() {
  editingId.value = null
  Object.assign(form, { name: '', email: '', password: '' })
}

function editAccount(account: Account) {
  if (saving.value) {
    if (import.meta.env.DEV) console.debug('[FIX] Ignored account switch while saving')
    return
  }
  editingId.value = account.id
  Object.assign(form, { name: account.name || '', email: account.email, password: '' })
}

async function loadAccounts() {
  loading.value = true
  error.value = ''
  try {
    accounts.value = (await request<{ data: Account[] }>('/api/users', { silent: true })).data
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function saveAccount() {
  if (saving.value) return
  if (!form.email.trim() || ((!editingId.value || form.password) && form.password.length < 6)) {
    ElMessage.warning('请输入邮箱，密码至少 6 位；修改时留空表示不更改密码')
    return
  }
  saving.value = true
  try {
    const id = editingId.value
    const payload = { name: form.name, email: form.email, ...(form.password ? { password: form.password } : {}) }
    const result = await request<{ data: Account }>(id ? `/api/users/${id}` : '/api/users', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(payload), silent: true })
    if (id === currentUserId && payload.password) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      ElMessage.success('密码已修改，请重新登录')
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      return
    }
    if (id === currentUserId) localStorage.setItem('auth_user', JSON.stringify(result.data))
    resetForm()
    ElMessage.success(id ? '账号已更新' : '访客账号已创建')
    await loadAccounts()
  } catch (err) {
    ElMessage.error(err instanceof ApiError ? (err.details[0] || err.message) : '保存失败')
  } finally {
    saving.value = false
  }
}

async function deleteAccount(account: Account) {
  try {
    await ElMessageBox.confirm(`确定删除账号 ${account.email} 吗？`, '删除账号', {
      type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消',
    })
  } catch { return }
  try {
    await request(`/api/users/${account.id}`, { method: 'DELETE', silent: true })
    if (editingId.value === account.id) resetForm()
    ElMessage.success('账号已删除')
    await loadAccounts()
  } catch (err) {
    ElMessage.error(err instanceof ApiError ? err.message : '删除失败')
  }
}

function openTransfer(account: Account) {
  transferSource.value = account
  transferTargetId.value = null
}

async function transferCustomers() {
  if (transferring.value || !transferSource.value || !transferTargetId.value) return
  const source = transferSource.value
  const target = transferTargets.value.find((item) => item.id === transferTargetId.value)
  if (!target) return
  try {
    await ElMessageBox.confirm(`将 ${source.email} 名下全部客户转移给 ${target.email}？`, '确认转移客户', {
      type: 'warning', confirmButtonText: '转移', cancelButtonText: '取消',
    })
  } catch { return }
  transferring.value = true
  try {
    const result = await request<{ data: { transferred: number } }>(`/api/users/${source.id}/transfer-customers`, {
      method: 'POST', body: JSON.stringify({ targetUserId: target.id }), silent: true,
    })
    ElMessage.success(`已转移 ${result.data.transferred} 个客户`)
    transferSource.value = null
    transferTargetId.value = null
  } catch (err) {
    ElMessage.error(err instanceof ApiError ? err.message : '转移失败')
  } finally {
    transferring.value = false
  }
}
onMounted(loadAccounts)
</script>

<template>
  <AdminLayout>
    <div class="page-head"><h1>用户管理</h1></div>
    <div class="crm-body">
      <el-card class="panel-card form-panel">
        <template #header><div class="card-header"><span>{{ editingId ? '修改账号' : '添加访客账号' }}</span><el-button v-if="editingId" :disabled="saving" @click="resetForm">取消</el-button></div></template>
        <el-form :disabled="saving" label-position="top" @submit.prevent="saveAccount">
          <el-form-item label="昵称（可选）"><el-input v-model="form.name" maxlength="50" /></el-form-item>
          <el-form-item label="登录邮箱"><el-input v-model="form.email" type="email" /></el-form-item>
          <el-form-item label="登录密码"><el-input v-model="form.password" type="password" :placeholder="editingId ? '留空则不修改密码' : '至少 6 位'" show-password /></el-form-item>
          <p v-if="!editingId">访客可以查看全部客户及跟进记录，不能修改数据。</p>
          <el-button type="primary" native-type="submit" :loading="saving">{{ editingId ? '保存修改' : '创建访客' }}</el-button>
        </el-form>
      </el-card>
      <el-card class="panel-card table-panel">
        <template #header><div class="card-header">账号列表</div></template>
        <p v-if="error">{{ error }}</p>
        <el-table v-else v-loading="loading" :data="accounts" stripe>
          <el-table-column prop="email" label="邮箱" />
          <el-table-column prop="name" label="昵称" />
          <el-table-column label="角色"><template #default="scope">{{ scope.row.role === 'ADMIN' ? '管理员' : scope.row.role === 'VIEWER' ? '访客' : '普通用户' }}</template></el-table-column>
          <el-table-column label="创建时间"><template #default="scope">{{ new Date(scope.row.createdAt).toLocaleString() }}</template></el-table-column>
          <el-table-column label="操作" width="240"><template #default="scope"><el-button size="small" :disabled="saving" @click="editAccount(scope.row)">修改</el-button><el-button size="small" :disabled="saving" @click="openTransfer(scope.row)">转移客户</el-button><el-button size="small" type="danger" plain :disabled="saving || scope.row.id === currentUserId" @click="deleteAccount(scope.row)">删除</el-button></template></el-table-column>
        </el-table>
      </el-card>
    </div>
    <el-dialog :model-value="!!transferSource" title="转移客户" :show-close="!transferring" :close-on-click-modal="!transferring" :close-on-press-escape="!transferring" @close="transferSource = null">
      <p>将 {{ transferSource?.email }} 名下的全部客户及其跟进记录转移给目标账号。访客为只读账号，不能作为目标。</p>
      <p v-if="!transferTargets.length">没有可接收客户的其他管理员或普通用户账号。</p>
      <el-select v-model="transferTargetId" placeholder="请选择目标账号" :disabled="transferring" style="width: 100%">
        <el-option v-for="account in transferTargets" :key="account.id" :label="account.email" :value="account.id" />
      </el-select>
      <template #footer><el-button :disabled="transferring" @click="transferSource = null">取消</el-button><el-button type="primary" :loading="transferring" :disabled="!transferTargetId" @click="transferCustomers">转移客户</el-button></template>
    </el-dialog>
  </AdminLayout>
</template>
