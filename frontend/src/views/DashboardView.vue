<template>
  <AdminLayout>
    <div class="content-page">
      <header class="content-header">
        <div>
          <p class="content-kicker">概览</p>
          <h1>首页</h1>
        </div>
        <span class="content-badge">Today</span>
      </header>

      <section class="summary-grid">
        <div class="summary-card">
          <span class="summary-label">新增客户</span>
          <strong>128</strong>
          <small>+12.3% vs last week</small>
        </div>
        <div class="summary-card">
          <span class="summary-label">订单金额</span>
          <strong>¥ 58,400</strong>
          <small>+8.7% vs last week</small>
        </div>
        <div class="summary-card">
          <span class="summary-label">活跃用户</span>
          <strong>3,482</strong>
          <small>+5.2% vs last week</small>
        </div>
      </section>

      <section class="content-grid">
        <div class="content-panel">
          <h2>运营概况</h2>
          <ul>
            <li>本月新增客户增长稳定，转化率提升明显。</li>
            <li>支付成功率保持在 98.4% 以上。</li>
            <li>用户活跃度在工作日高峰期更集中。</li>
          </ul>
        </div>
        <div class="content-panel">
          <h2>待办事项</h2>
          <ul>
            <li>审核 12 条新增商户申请</li>
            <li>回访 7 位高价值客户</li>
            <li>检查系统警报与异常日志</li>
          </ul>
        </div>
      </section>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import AdminLayout from './AdminLayout.vue'
</script>
