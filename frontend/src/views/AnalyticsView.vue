<script setup lang="ts">
import { onMounted } from 'vue'
import AdminLayout from './AdminLayout.vue'
import { customersApi } from '../api/customers'
import { useAsync } from '../composables/useAsync'

const { data, loading, error, run } = useAsync(() => customersApi.stats())
const statuses = [
  { label: '线索', key: 'LEAD' },
  { label: '跟进中', key: 'FOLLOWING' },
  { label: '已成交', key: 'WON' },
  { label: '已流失', key: 'LOST' },
] as const
onMounted(() => { void run() })
</script>

<template>
  <AdminLayout>
    <div class="content-page">
      <header class="content-header">
        <div><p class="content-kicker">报表</p><h1>数据分析</h1></div>
        <span class="content-badge">客户数据</span>
      </header>
      <p v-if="loading">加载中...</p>
      <div v-else-if="error">
        <p>{{ error.message }}</p>
        <el-button @click="run()">重试</el-button>
      </div>
      <template v-else-if="data">
        <section class="summary-grid">
          <div class="summary-card"><span class="summary-label">客户总数</span><strong>{{ data.data.totalCustomers }}</strong><small>当前账号可查看的客户</small></div>
          <div class="summary-card"><span class="summary-label">跟进记录</span><strong>{{ data.data.totalFollowUps }}</strong><small>当前账号可查看的跟进记录</small></div>
          <div class="summary-card"><span class="summary-label">已成交</span><strong>{{ data.data.statusCounts.WON ?? 0 }}</strong><small>按当前客户状态统计</small></div>
        </section>
        <section class="content-grid">
          <div class="content-panel">
            <h2>客户状态分布</h2>
            <ul><li v-for="status in statuses" :key="status.key">{{ status.label }}：{{ data.data.statusCounts[status.key] ?? 0 }}</li></ul>
          </div>
        </section>
      </template>
    </div>
  </AdminLayout>
</template>
