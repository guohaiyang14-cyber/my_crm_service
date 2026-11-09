<template>
  <AdminLayout>
    <div class="content-page">
      <header class="content-header">
        <div>
          <p class="content-kicker">应用</p>
          <h1>应用管理</h1>
        </div>
        <span class="content-badge">Manage</span>
      </header>

      <el-alert title="示例数据，尚未接入实际业务" type="warning" :closable="false" show-icon />

      <section class="summary-grid">
        <div class="summary-card">
          <span class="summary-label">已启用</span>
          <strong>24</strong>
          <small>全部运行正常</small>
        </div>
        <div class="summary-card">
          <span class="summary-label">待审核</span>
          <strong>6</strong>
          <small>需在 48 小时内处理</small>
        </div>
        <div class="summary-card">
          <span class="summary-label">异常应用</span>
          <strong>1</strong>
          <small>已通知运维处理</small>
        </div>
      </section>

      <section class="content-grid">
        <div class="content-panel">
          <h2>应用列表</h2>
          <ul>
            <li>CRM 客户管理系统</li>
            <li>运营中心后台</li>
            <li>支付汇总服务</li>
            <li>权限控制平台</li>
          </ul>
        </div>
        <div class="content-panel">
          <h2>近期动态</h2>
          <ul>
            <li>新版权限策略已灰度发布</li>
            <li>客户服务模块已更新 API</li>
            <li>应用日志清理已完成</li>
          </ul>
        </div>
      </section>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import AdminLayout from './AdminLayout.vue'
</script>
