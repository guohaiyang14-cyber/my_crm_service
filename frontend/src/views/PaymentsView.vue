<template>
  <AdminLayout>
    <div class="content-page">
      <header class="content-header">
        <div>
          <p class="content-kicker">财务</p>
          <h1>支付管理</h1>
        </div>
        <span class="content-badge">Finance</span>
      </header>

      <el-alert title="示例数据，尚未接入实际业务" type="warning" :closable="false" show-icon />

      <section class="summary-grid">
        <div class="summary-card">
          <span class="summary-label">今日流水</span>
          <strong>¥ 42,180</strong>
          <small>+9.8% vs yesterday</small>
        </div>
        <div class="summary-card">
          <span class="summary-label">成功率</span>
          <strong>98.4%</strong>
          <small>稳定提升</small>
        </div>
        <div class="summary-card">
          <span class="summary-label">待结算</span>
          <strong>¥ 16,900</strong>
          <small>12 笔待处理</small>
        </div>
      </section>

      <section class="content-grid">
        <div class="content-panel">
          <h2>支付渠道</h2>
          <ul>
            <li>微信支付</li>
            <li>支付宝</li>
            <li>银行卡转账</li>
            <li>平台余额</li>
          </ul>
        </div>
        <div class="content-panel">
          <h2>结算提醒</h2>
          <ul>
            <li>2 笔代发款待复核</li>
            <li>3 个分账账户待确认</li>
            <li>1 个收款商户需补充信息</li>
          </ul>
        </div>
      </section>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import AdminLayout from './AdminLayout.vue'
</script>
