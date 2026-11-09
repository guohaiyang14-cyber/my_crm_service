<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  DataAnalysis,
  House,
  Operation,
  Setting,
  SwitchButton,
  User,
  Wallet,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppearanceActions from '../components/AppearanceActions.vue'
import {
  customersApi,
  type Customer,
  type CustomerPayload,
  type CustomerStatus,
} from '../api/customers'
import { useAsync } from '../composables/useAsync'
import { toast } from '../composables/useToast'

const route = useRoute()

const menuItems = [
  { label: '首页', to: '/dashboard', icon: House },
  { label: '应用管理', to: '/apps', icon: Operation },
  { label: '支付管理', to: '/payments', icon: Wallet },
  { label: '用户管理', to: '/users', icon: User },
  { label: '数据分析', to: '/analytics', icon: DataAnalysis },
  { label: '服务配置', to: '/settings', icon: Setting },
  { label: '系统管理', to: '/system', icon: SwitchButton },
]

function isActive(path: string) {
  return route.path === path || (path === '/dashboard' && route.path === '/')
}

const PAGE_SIZE = 10
const search = ref('')
const statusFilter = ref<'ALL' | CustomerStatus>('ALL')
const page = ref(1)
const editingId = ref<number | null>(null)

const emptyForm: CustomerPayload = {
  name: '',
  company: '',
  phone: '',
  wechat: '',
  source: '',
  status: 'LEAD',
  notes: '',
}

const form = reactive<CustomerPayload>({ ...emptyForm })

const { data, loading, error, run } = useAsync(() =>
  customersApi.list({
    search: search.value.trim() || undefined,
    status: statusFilter.value === 'ALL' ? undefined : statusFilter.value,
    page: page.value,
    pageSize: PAGE_SIZE,
  })
)

const customers = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.meta.total ?? 0)
const totalPages = computed(() => data.value?.meta.totalPages ?? 1)
const hasToken = computed(() => !!localStorage.getItem('auth_token'))

async function loadPage(nextPage: number) {
  page.value = Math.max(1, nextPage)
  await run()
}

onMounted(() => {
  loadPage(1)
})

function resetForm() {
  editingId.value = null
  Object.assign(form, emptyForm)
}

function fillForm(customer: Customer) {
  editingId.value = customer.id
  Object.assign(form, {
    name: customer.name,
    company: customer.company ?? '',
    phone: customer.phone ?? '',
    wechat: customer.wechat ?? '',
    source: customer.source ?? '',
    status: customer.status,
    notes: customer.notes ?? '',
  })
}

async function handleSubmit() {
  const payload: CustomerPayload = {
    name: form.name.trim(),
    company: form.company?.trim() || null,
    phone: form.phone?.trim() || null,
    wechat: form.wechat?.trim() || null,
    source: form.source?.trim() || null,
    status: form.status || 'LEAD',
    notes: form.notes?.trim() || null,
  }

  if (!payload.name) {
    toast('客户姓名不能为空', 'warning')
    return
  }

  try {
    if (editingId.value) {
      await customersApi.update(editingId.value, payload)
      ElMessage.success('客户已更新')
    } else {
      await customersApi.create(payload)
      ElMessage.success('客户已创建')
    }
    resetForm()
    await loadPage(page.value)
  } catch {
    ElMessage.error('保存失败')
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确认删除这个客户吗？', '删除客户', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await customersApi.remove(id)
    ElMessage.success('删除成功')
    await loadPage(page.value)
  } catch {
    // cancel
  }
}

function handleLogout() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
  window.dispatchEvent(new CustomEvent('auth:unauthorized'))
}

async function onSearch() {
  page.value = 1
  await run()
}

const statusOptions: Array<{ label: string; value: 'ALL' | CustomerStatus }> = [
  { label: '全部状态', value: 'ALL' },
  { label: '线索', value: 'LEAD' },
  { label: '跟进中', value: 'FOLLOWING' },
  { label: '已成交', value: 'WON' },
  { label: '已流失', value: 'LOST' },
]
</script>

<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="brand-block">
        <div class="brand-mark">CTM</div>
        <div class="brand-text">管理后台</div>
      </div>

      <nav class="sidebar-nav" aria-label="主导航">
        <RouterLink
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ active: isActive(item.to) }"
        >
          <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <main class="workspace">
      <header class="workspace-topbar">
        <div class="breadcrumbs">首页 / 用户管理 / 用户详情</div>
        <div class="top-actions">
          <AppearanceActions />
          <el-button v-if="hasToken" class="top-btn" plain @click="handleLogout"
            >退出登录</el-button
          >
        </div>
      </header>

      <div class="crm-shell">
        <div class="page-head">
          <h1>用户详情：PdeAsGhj</h1>
        </div>

        <section class="stats-grid">
          <el-card shadow="hover">
            <div class="stat-label">总客户数</div>
            <div class="stat-value">{{ total }}</div>
          </el-card>
          <el-card shadow="hover">
            <div class="stat-label">跟进中</div>
            <div class="stat-value">
              {{ customers.filter(item => item.status === 'FOLLOWING').length }}
            </div>
          </el-card>
          <el-card shadow="hover">
            <div class="stat-label">已成交</div>
            <div class="stat-value">
              {{ customers.filter(item => item.status === 'WON').length }}
            </div>
          </el-card>
        </section>

        <div class="crm-body">
          <el-card shadow="hover" class="panel-card form-panel">
            <template #header>
              <div class="card-header">
                <span>{{ editingId ? '编辑客户' : '新增客户' }}</span>
                <el-button v-if="editingId" size="small" @click="resetForm">取消</el-button>
              </div>
            </template>

            <el-form :model="form" label-position="top" @submit.prevent="handleSubmit">
              <div class="form-grid">
                <el-form-item label="姓名">
                  <el-input v-model="form.name" />
                </el-form-item>
                <el-form-item label="公司">
                  <el-input v-model="form.company" />
                </el-form-item>
                <el-form-item label="手机号">
                  <el-input v-model="form.phone" />
                </el-form-item>
                <el-form-item label="微信">
                  <el-input v-model="form.wechat" />
                </el-form-item>
                <el-form-item label="来源">
                  <el-input v-model="form.source" />
                </el-form-item>
                <el-form-item label="状态">
                  <el-select v-model="form.status" placeholder="请选择状态">
                    <el-option label="线索" value="LEAD" />
                    <el-option label="跟进中" value="FOLLOWING" />
                    <el-option label="已成交" value="WON" />
                    <el-option label="已流失" value="LOST" />
                  </el-select>
                </el-form-item>
                <el-form-item class="full-width" label="备注">
                  <el-input v-model="form.notes" type="textarea" :rows="3" />
                </el-form-item>
              </div>

              <div class="submit-row">
                <el-button type="primary" native-type="submit">{{
                  editingId ? '保存修改' : '新增客户'
                }}</el-button>
              </div>
            </el-form>
          </el-card>

          <el-card shadow="hover" class="panel-card table-panel">
            <template #header>
              <div class="card-header">
                <span>客户列表</span>
              </div>
            </template>

            <div class="toolbar">
              <el-input
                v-model="search"
                placeholder="搜索客户/公司/电话"
                clearable
                @keyup.enter="onSearch"
              />
              <el-select v-model="statusFilter" @change="onSearch" style="width: 160px">
                <el-option
                  v-for="item in statusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <el-button type="primary" @click="onSearch">搜索</el-button>
            </div>

            <div v-if="loading" class="table-empty">加载中...</div>
            <div v-else-if="error" class="table-empty">{{ error.message }}</div>
            <div v-else-if="customers.length === 0" class="table-empty">暂无客户数据</div>
            <el-table v-else :data="customers" stripe>
              <el-table-column prop="name" label="姓名" />
              <el-table-column prop="company" label="公司" />
              <el-table-column prop="phone" label="电话" />
              <el-table-column prop="status" label="状态">
                <template #default="scope">
                  <el-tag
                    :type="
                      scope.row.status === 'WON'
                        ? 'success'
                        : scope.row.status === 'LOST'
                          ? 'danger'
                          : 'warning'
                    "
                  >
                    {{ scope.row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="nextFollowUpAt" label="下次跟进">
                <template #default="scope">
                  {{
                    scope.row.nextFollowUpAt
                      ? new Date(scope.row.nextFollowUpAt).toLocaleString()
                      : '未设置'
                  }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="180">
                <template #default="scope">
                  <el-button size="small" @click="fillForm(scope.row)">编辑</el-button>
                  <el-button size="small" type="danger" plain @click="handleDelete(scope.row.id)"
                    >删除</el-button
                  >
                </template>
              </el-table-column>
            </el-table>

            <div v-if="totalPages > 1" class="pagination-wrap">
              <el-pagination
                :current-page="page"
                :page-size="PAGE_SIZE"
                :total="total"
                background
                layout="prev, pager, next"
                @current-change="loadPage"
              />
            </div>
          </el-card>
        </div>
      </div>
    </main>
  </div>
</template>
