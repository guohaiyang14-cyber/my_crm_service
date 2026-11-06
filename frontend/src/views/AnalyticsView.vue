<template>
  <AdminLayout>
    <div class="content-page">
      <header class="content-header">
        <div>
          <p class="content-kicker">报表</p>
          <h1>数据分析</h1>
        </div>
        <span class="content-badge">Reports</span>
      </header>

      <section class="summary-grid">
        <div class="summary-card">
          <span class="summary-label">访问量</span>
          <strong>88,320</strong>
          <small>+14.1% month on month</small>
        </div>
        <div class="summary-card">
          <span class="summary-label">转化率</span>
          <strong>6.8%</strong>
          <small>提升 0.9 个点</small>
        </div>
        <div class="summary-card">
          <span class="summary-label">留存率</span>
          <strong>74.5%</strong>
          <small>高于目标线</small>
        </div>
      </section>

      <section class="content-grid">
        <div class="content-panel">
          <h2>流量来源</h2>
          <ul>
            <li>搜索引擎 42%</li>
            <li>直接访问 27%</li>
            <li>外链推荐 18%</li>
            <li>社交渠道 13%</li>
          </ul>
        </div>
        <div class="content-panel">
          <h2>核心指标</h2>
          <ul>
            <li>注册转化率持续上升</li>
            <li>付费用户当前增长平稳</li>
            <li>高价值用户回访率提升</li>
          </ul>
        </div>
      </section>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import AdminLayout from './AdminLayout.vue'
</script>
