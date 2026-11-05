<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { useAsync } from '../composables/useAsync'
import { projectsApi } from '../api/projects'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import EmptyState from '../components/EmptyState.vue'

const router = useRouter()
const PAGE_SIZE = 6
const page = ref(1)

const { data, loading, error, run } = useAsync((currentPage: number) =>
  projectsApi.list({ page: currentPage, pageSize: PAGE_SIZE })
)

const projects = computed(() => data.value?.data ?? [])
const totalPages = computed(() => {
  const meta = data.value?.pagination
  if (meta?.totalPages) return Math.max(1, meta.totalPages)
  if (!meta?.total && projects.value.length === 0) return 1
  if (meta?.total) return Math.max(1, Math.ceil(meta.total / PAGE_SIZE))
  return Math.max(1, Math.ceil(projects.value.length / PAGE_SIZE))
})
const hasPrevPage = computed(() => page.value > 1)
const hasNextPage = computed(() => page.value < totalPages.value)
const hasToken = computed(() => !!localStorage.getItem('auth_token'))

async function loadPage(nextPage: number) {
  const targetPage = Math.max(1, nextPage)
  page.value = targetPage
  await run(targetPage)
}

onMounted(() => {
  loadPage(1)
})

async function handleDelete(slug: string) {
  try {
    await ElMessageBox.confirm(`确定要删除作品 "${slug}" 吗？`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })

    try {
      await projectsApi.remove(slug)
      await loadPage(Math.max(1, page.value))
      ElMessage.success('删除成功')
    } catch {
      ElMessage.error('删除失败')
    }
  } catch {
    // 用户取消删除，不做处理
  }
}

function handleLoginOut() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
  router.push('/login')
}

function scrollToPortfolio() {
  const el = window.document.getElementById('portfolio-grid')
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="page-shell">
    <header class="page-header">
      <div class="brand-mark">
        <span class="brand-badge">作品集</span>
      </div>

      <div class="header-actions">
        <el-button type="primary" @click="router.push('/new')">+ 新增作品</el-button>
        <el-button v-if="hasToken" plain @click="handleLoginOut">退出登录</el-button>
      </div>
    </header>

    <section class="hero-panel panel-card">
      <div class="hero-copy">
        <p class="eyebrow">Creative Systems / 作品集</p>
        <h1>构建下一波数字体验浪潮。</h1>
        <p class="hero-subtitle">
          我专注于构建高质感、可扩展的 Web 产品与交互体验，帮助创意在代码中生长成可持续的产品资产。
        </p>

        <div class="hero-actions">
          <el-button type="primary" size="large" @click="scrollToPortfolio()">查看作品</el-button>
        </div>

        <div class="hero-stats">
          <div>
            <strong>6+</strong>
            <span>年经验</span>
          </div>
          <div>
            <strong>24</strong>
            <span>项目</span>
          </div>
          <div>
            <strong>99%</strong>
            <span>专注</span>
          </div>
        </div>
      </div>

      <div class="hero-visual">
        <div class="orbit orbit-one"></div>
        <div class="orbit orbit-two"></div>
        <div class="dashboard-card">
          <div class="dashboard-header">
            <span class="dot dot-pink"></span>
            <span class="dot dot-purple"></span>
            <span class="dot dot-cyan"></span>
          </div>
          <div class="dashboard-body">
            <div class="mini-chart">
              <span style="height: 36%"></span>
              <span style="height: 55%"></span>
              <span style="height: 72%"></span>
              <span style="height: 50%"></span>
              <span style="height: 90%"></span>
              <span style="height: 68%"></span>
            </div>
            <div class="stat-stack">
              <div class="stat-pill">
                <small>上线</small>
                <strong>+142%</strong>
              </div>
              <div class="stat-pill neon">
                <small>体验</small>
                <strong>卓越</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="feature-row">
      <div class="feature-item panel-card">
        <span class="feature-icon">01</span>
        <h3>产品思维</h3>
        <p>将用户需求、技术边界和商业价值融合为清晰的产品策略。</p>
      </div>
      <div class="feature-item panel-card">
        <span class="feature-icon">02</span>
        <h3>设计系统</h3>
        <p>构建统一组件、可复用模式与一致的交互语言，提高迭代效率。</p>
      </div>
      <div class="feature-item panel-card">
        <span class="feature-icon">03</span>
        <h3>性能优化</h3>
        <p>追求极致体验，结合前端工程与性能优化，让产品更快、更稳。</p>
      </div>
    </section>

    <section class="portfolio-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Featured works</p>
          <h2>精选作品</h2>
        </div>
      </div>

      <el-card shadow="hover" class="panel-card projects-panel">
        <LoadingState v-if="loading" />
        <ErrorState v-else-if="error" :error="error" :retry="() => loadPage(page)" />
        <EmptyState v-else-if="projects.length === 0" />

        <template v-else>
          <div id="portfolio-grid" class="project-grid">
            <el-card v-for="p in projects" :key="p.slug" shadow="hover" class="project-card">
              <div class="project-top">
                <div>
                  <p class="project-label">作品</p>
                  <h2>{{ p.title }}</h2>
                </div>
                <el-tag v-if="p.featured" type="warning" effect="light">精选</el-tag>
              </div>

              <p class="summary">{{ p.summary }}</p>

              <div class="tag-list">
                <el-tag v-for="t in p.techStack" :key="t" type="info" size="small" effect="plain">
                  {{ t }}
                </el-tag>
              </div>

              <div class="project-links">
                <el-link v-if="p.repoUrl" :href="p.repoUrl" target="_blank" rel="noreferrer"
                  >代码</el-link
                >
                <el-link v-if="p.demoUrl" :href="p.demoUrl" target="_blank" rel="noreferrer"
                  >在线</el-link
                >
              </div>

              <div class="project-actions" v-if="hasToken">
                <el-button
                  size="small"
                  type="primary"
                  plain
                  @click="router.push(`/edit/${p.slug}`)"
                >
                  编辑
                </el-button>
                <el-button size="small" type="danger" plain @click="handleDelete(p.slug)">
                  删除
                </el-button>
              </div>
            </el-card>
          </div>

          <div v-if="totalPages > 1" class="pagination-wrap">
            <el-pagination
              :current-page="page"
              :page-size="PAGE_SIZE"
              :total="data?.pagination?.total ?? projects.length"
              background
              layout="prev, pager, next"
              @current-change="loadPage"
            />
          </div>
        </template>
      </el-card>
    </section>
  </div>
</template>
