<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { aiApi } from '../api/ai'
import { projectsApi, type ProjectCreatePayload } from '../api/projects'
import { toast } from '../composables/useToast'
import { useAsync } from '../composables/useAsync'
import ErrorState from '../components/ErrorState.vue'
import LoadingState from '../components/LoadingState.vue'

const route = useRoute()
const router = useRouter()
const slug = computed(() => (typeof route.params.slug === 'string' ? route.params.slug : ''))
const isEdit = computed(() => !!slug.value)
const formRef = ref<FormInstance>()
const aiLoading = ref(false)

const emptyForm: ProjectCreatePayload = {
  slug: '',
  title: '',
  summary: '',
  techStack: [],
  repoUrl: null,
  demoUrl: null,
  featured: false,
}

const form = ref<ProjectCreatePayload>({ ...emptyForm })
const techStackInput = ref('')
const rules = reactive<FormRules>({
  slug: [
    { required: true, message: '请输入作品 slug', trigger: 'blur' },
    {
      pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      message: 'Slug 只能包含小写字母、数字和中划线',
      trigger: 'blur',
    },
  ],
  title: [{ required: true, message: '请输入作品标题', trigger: 'blur' }],
  summary: [
    { required: true, message: '请输入作品简介', trigger: 'blur' },
    { min: 10, max: 200, message: '简介长度应在 10~200 个字符之间', trigger: 'blur' },
  ],
})

const {
  data: detailData,
  loading: loadingDetail,
  error: detailError,
  run: fetchDetail,
} = useAsync(() => projectsApi.get(slug.value))

const {
  loading: submitting,
  error: submitError,
  run: submitForm,
} = useAsync((payload: ProjectCreatePayload) => {
  if (isEdit.value) return projectsApi.update(slug.value, payload)
  return projectsApi.create(payload)
})

watch(
  slug,
  currentSlug => {
    if (!currentSlug) {
      form.value = { ...emptyForm }
      techStackInput.value = ''
      return
    }

    fetchDetail()
  },
  { immediate: true }
)

watch(detailData, newVal => {
  if (newVal && newVal.data) {
    const p = newVal.data
    form.value = {
      slug: p.slug,
      title: p.title,
      summary: p.summary || '',
      techStack: p.techStack,
      repoUrl: p.repoUrl || null,
      demoUrl: p.demoUrl || null,
      featured: p.featured,
    }
    techStackInput.value = p.techStack.join(', ')
  }
})

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  form.value.techStack = techStackInput.value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  const { ok } = await submitForm(form.value)

  if (ok) {
    router.push('/')
  }
}

async function handleAIGenerate() {
  if (!form.value.title) {
    toast('请先填写标题', 'warning')
    return
  }

  form.value.techStack = techStackInput.value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  aiLoading.value = true
  try {
    const res = await aiApi.generateInfo({
      title: form.value.title,
      techStack: form.value.techStack,
    })
    form.value.summary = res.data.summary
  } catch (error) {
    console.error('AI summary generation failed:', error)
    toast('AI 暂时开小差了，请自己写一段简介吧~', 'warning')
  } finally {
    aiLoading.value = false
  }
}
</script>

<template>
  <div class="page-shell">
    <header class="page-header">
      <div>
        <p class="eyebrow">内容管理</p>
        <h1>{{ isEdit ? '编辑作品' : '新增作品' }}</h1>
      </div>
      <RouterLink to="/" class="back-link">← 返回列表</RouterLink>
    </header>

    <el-card shadow="hover" class="panel-card">
      <LoadingState v-if="loadingDetail" />

      <div v-else>
        <ErrorState v-if="detailError" :error="detailError" />
        <ErrorState v-if="submitError" :error="submitError" />

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          class="project-form"
          label-position="top"
          @submit.prevent="onSubmit"
        >
          <div class="form-grid">
            <el-form-item prop="slug" label="Slug">
              <el-input v-model="form.slug" placeholder="my-project" />
            </el-form-item>

            <el-form-item prop="title" label="标题">
              <el-input v-model="form.title" />
            </el-form-item>

            <el-form-item prop="summary" label="简介">
              <el-input v-model="form.summary" type="textarea" :rows="4" />
            </el-form-item>

            <el-form-item label="技术栈">
              <el-input v-model="techStackInput" placeholder="Vue, Express" />
            </el-form-item>

            <el-form-item label="仓库地址">
              <el-input v-model="form.repoUrl" placeholder="https://github.com/..." />
            </el-form-item>

            <el-form-item label="演示地址">
              <el-input v-model="form.demoUrl" placeholder="https://example.com" />
            </el-form-item>

            <el-form-item label="精选作品">
              <el-switch v-model="form.featured" />
            </el-form-item>
          </div>

          <div class="submit-row">
            <el-button type="button" @click="handleAIGenerate" :disabled="aiLoading">
              {{ aiLoading ? '✨ 生成中...' : '✨ AI 代写' }}
            </el-button>
            <el-button @click="router.push('/')">取消</el-button>
            <el-button type="primary" native-type="submit" :loading="submitting">
              {{ submitting ? '提交中...' : '保存' }}
            </el-button>
          </div>
        </el-form>
      </div>
    </el-card>
  </div>
</template>
