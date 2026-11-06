<template>
  <AdminLayout>
    <div class="content-page">
      <header class="content-header">
        <div>
          <p class="content-kicker">配置</p>
          <h1>服务配置</h1>
        </div>
        <span class="content-badge">Config</span>
      </header>

      <section class="summary-grid">
        <div class="summary-card">
          <span class="summary-label">配置项</span>
          <strong>86</strong>
          <small>已全部接入管理</small>
        </div>
        <div class="summary-card">
          <span class="summary-label">变更记录</span>
          <strong>14</strong>
          <small>本月新增</small>
        </div>
        <div class="summary-card">
          <span class="summary-label">风险项</span>
          <strong>2</strong>
          <small>需人工复查</small>
        </div>
      </section>

      <section class="content-grid">
        <div class="content-panel">
          <h2>配置中心</h2>
          <ul>
            <li>认证与权限策略</li>
            <li>短信与邮件模板</li>
            <li>第三方服务参数</li>
            <li>环境变量与发布配置</li>
          </ul>
        </div>
        <div class="content-panel">
          <h2>最近变更</h2>
          <ul>
            <li>更新登录策略加固参数</li>
            <li>调整支付回调超时</li>
            <li>新增风控白名单规则</li>
          </ul>
        </div>
      </section>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import AdminLayout from './AdminLayout.vue'
</script>
