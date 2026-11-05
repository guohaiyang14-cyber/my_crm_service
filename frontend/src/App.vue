<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import ToastHost from './components/ToastHost.vue'
import ParticleBackground from './components/ParticleBackground.vue'

const router = useRouter()

function handleUnauthorized() {
  if (router.currentRoute.value.path !== '/login') {
    router.push('/login')
  }
}

onMounted(() => {
  window.addEventListener('auth:unauthorized', handleUnauthorized)
})

onUnmounted(() => {
  window.removeEventListener('auth:unauthorized', handleUnauthorized)
})
</script>

<template>
  <div class="app-shell">
    <ParticleBackground />
    <div class="app-content">
      <RouterView />
      <ToastHost />
    </div>
  </div>
</template>
