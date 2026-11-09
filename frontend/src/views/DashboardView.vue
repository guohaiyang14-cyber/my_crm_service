<script setup lang="ts">
import { onMounted } from 'vue'
import AdminLayout from './AdminLayout.vue'
import { customersApi } from '../api/customers'
import { useAsync } from '../composables/useAsync'

const { data, loading, error, run } = useAsync(() => customersApi.stats())
onMounted(() => { void run() })
</script>

<template>
  <AdminLayout>
    <div class="content-page">
      <header class="content-header">
        <div><p class="content-kicker">概览</p><h1>首页</h1></div>
        <span class="content-badge">客户概览</span>
      </header>
      <p v-if="loading">加载中...</p>
      <div v-else-if="error"><p>{{ error.message }}</p><el-button @click="run()">重试</el-button></div>
      <section v-else-if="data" class="summary-grid">
        <div class="summary-card"><span class="summary-label">客户总数</span><strong>{{ data.data.totalCustomers }}</strong><small>当前账号可查看的客户</small></div>
        <div class="summary-card"><span class="summary-label">跟进中</span><strong>{{ data.data.statusCounts.FOLLOWING ?? 0 }}</strong><small>按当前客户状态统计</small></div>
        <div class="summary-card"><span class="summary-label">已成交</span><strong>{{ data.data.statusCounts.WON ?? 0 }}</strong><small>按当前客户状态统计</small></div>
      </section>
    </div>
  </AdminLayout>
</template>
