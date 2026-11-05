<script setup lang="ts">
import { toasts } from '../composables/useToast'
</script>

<template>
  <div class="toast-host">
    <div v-for="t in toasts" :key="t.id" :class="['toast', `toast--${t.type}`]" role="alert">
      {{ t.message }}
    </div>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.toast {
  padding: 12px 16px;
  border-radius: 6px;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 360px;
  animation: slideIn 0.2s ease-out;
}
.toast--error {
  background: #d93025;
}
.toast--warning {
  background: #f9ab00;
}
.toast--success {
  background: #1e8e3e;
}
@keyframes slideIn {
  from {
    transform: translateX(20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
