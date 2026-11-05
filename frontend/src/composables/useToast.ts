import { reactive } from 'vue'

export type ToastType = 'error' | 'warning' | 'success'

export interface ToastItem {
  id: symbol
  message: string
  type: ToastType
}

export const toasts = reactive<ToastItem[]>([])

export function toast(message: string, type: ToastType = 'error', timeout = 3000): void {
  const id = Symbol('toast')
  toasts.push({ id, message, type })

  setTimeout(() => {
    const index = toasts.findIndex(item => item.id === id)
    if (index >= 0) {
      toasts.splice(index, 1)
    }
  }, timeout)
}
