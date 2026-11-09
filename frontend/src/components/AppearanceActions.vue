<script setup lang="ts">
import { Moon, Setting, Sunny } from '@element-plus/icons-vue'
import { useAppearance } from '../composables/useAppearance'

const { theme, accent, setTheme, setAccent } = useAppearance()
</script>

<template>
  <el-popover placement="bottom-end" trigger="click" :width="260">
    <template #reference>
      <button class="top-btn" type="button">预设设置</button>
    </template>
    <div class="appearance-options">
      <strong>界面外观</strong>
      <span>主题</span>
      <el-radio-group :model-value="theme" @change="setTheme">
        <el-radio-button value="light">浅色</el-radio-button>
        <el-radio-button value="dark">深色</el-radio-button>
      </el-radio-group>
      <span>配色</span>
      <el-radio-group :model-value="accent" @change="setAccent">
        <el-radio-button value="blue">蓝色</el-radio-button>
        <el-radio-button value="green">绿色</el-radio-button>
        <el-radio-button value="purple">紫色</el-radio-button>
      </el-radio-group>
    </div>
  </el-popover>
  <button class="top-btn small" type="button" :aria-label="theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'" @click="setTheme(theme === 'dark' ? 'light' : 'dark')">
    <el-icon><Sunny v-if="theme === 'dark'" /><Moon v-else /></el-icon>
  </button>
  <RouterLink class="top-btn small top-link" to="/settings" aria-label="服务配置">
    <el-icon><Setting /></el-icon>
  </RouterLink>
</template>
