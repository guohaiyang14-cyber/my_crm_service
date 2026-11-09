<template>
  <AdminLayout>
    <div class="content-page">
      <header class="content-header">
        <div>
          <p class="content-kicker">系统</p>
          <h1>系统管理</h1>
        </div>
        <span class="content-badge">System</span>
      </header>

      <el-alert title="示例数据，尚未接入实际业务" type="warning" :closable="false" show-icon />

      <section class="summary-grid">
        <div class="summary-card">
          <span class="summary-label">服务器</span>
          <strong>3 / 3</strong>
          <small>全部在线</small>
        </div>
        <div class="summary-card">
          <span class="summary-label">告警</span>
          <strong>4</strong>
          <small>1 条需要处理</small>
        </div>
        <div class="summary-card">
          <span class="summary-label">任务状态</span>
          <strong>93%</strong>
          <small>调度正常</small>
        </div>
      </section>

      <section class="content-grid">
        <div class="content-panel">
          <h2>运行状态</h2>
          <ul>
            <li>API 服务运行正常</li>
            <li>数据库连接稳定</li>
            <li>缓存命中率保持高位</li>
          </ul>
        </div>
        <div class="content-panel">
          <h2>维护日志</h2>
          <ul>
            <li>部署计划已执行完成</li>
            <li>自动备份任务正常</li>
            <li>日志清理已按计划执行</li>
          </ul>
        </div>
      </section>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import AdminLayout from './AdminLayout.vue'
</script>
