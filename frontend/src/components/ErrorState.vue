<script setup lang="ts">
import type { ApiError } from '../api/client'

interface Props {
  error: ApiError
  retry?: () => Promise<unknown> | void
}

const props = defineProps<Props>()
</script>

<template>
  <div class="state state--error" role="alert">
    <h3>请求失败</h3>
    <p>
      <code class="error-code">{{ props.error.code }}</code>
    </p>
    <p>{{ props.error.message }}</p>
    <ul v-if="props.error.details?.length" class="error-details">
      <li v-for="(d, i) in props.error.details" :key="i">{{ d }}</li>
    </ul>
    <button v-if="props.retry" @click="props.retry">重试</button>
  </div>
</template>
