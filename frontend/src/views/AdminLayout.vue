<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  DataAnalysis,
  House,
  Operation,
  Setting,
  SwitchButton,
  User,
  Wallet,
} from '@element-plus/icons-vue'
import AppearanceActions from '../components/AppearanceActions.vue'

const route = useRoute()
const router = useRouter()

const menuItems = [
  { label: '首页', to: '/dashboard', icon: House },
  { label: '应用管理', to: '/apps', icon: Operation },
  { label: '支付管理', to: '/payments', icon: Wallet },
  { label: '客户管理', to: '/users', icon: User },
  ...(getRole() === 'ADMIN' ? [{ label: '用户管理', to: '/accounts', icon: User }] : []),
  { label: '数据分析', to: '/analytics', icon: DataAnalysis },
  { label: '服务配置', to: '/settings', icon: Setting },
  { label: '系统管理', to: '/system', icon: SwitchButton },
]

const breadcrumbMap: Record<string, string> = {
  '/dashboard': '首页 / 概览',
  '/apps': '首页 / 应用管理',
  '/payments': '首页 / 支付管理',
  '/users': '首页 / 客户管理',
  '/accounts': '首页 / 用户管理',
  '/analytics': '首页 / 数据分析',
  '/settings': '首页 / 服务配置',
  '/system': '首页 / 系统管理',
}

const breadcrumb = computed(() => breadcrumbMap[route.path] ?? '首页 / 控制台')
const hasToken = computed(() => !!localStorage.getItem('auth_token'))

function getRole() {
  try { return JSON.parse(localStorage.getItem('auth_user') || '{}').role } catch { return undefined }
}

function isActive(path: string) {
  return route.path === path || (path === '/dashboard' && route.path === '/')
}

function handleLogout() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
  router.push('/login')
}
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
        <div class="breadcrumbs">{{ breadcrumb }}</div>
        <div class="top-actions">
          <AppearanceActions />
          <el-button v-if="hasToken" class="top-btn" plain @click="handleLogout"
            >退出登录</el-button
          >
        </div>
      </header>

      <div class="crm-shell">
        <slot />
      </div>
    </main>
  </div>
</template>
