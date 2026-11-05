import { ref, type Ref } from 'vue'
import { ApiError } from '../api/client'

function normalizeError(error: unknown): ApiError {
  return error instanceof ApiError
    ? error
    : new ApiError({ status: 0, code: 'NETWORK_ERROR', message: '无法连接服务器' })
}

export function useAsync<T, A extends unknown[] = unknown[]>(fn: (...args: A) => Promise<T>) {
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<ApiError | null>(null)

  async function run(...args: A): Promise<{ ok: true; data: T } | { ok: false; error: ApiError }> {
    loading.value = true
    error.value = null

    try {
      const result = await fn(...args)
      data.value = result
      return { ok: true, data: result }
    } catch (caughtError) {
      const normalized = normalizeError(caughtError)
      error.value = normalized
      return { ok: false, error: normalized }
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, run }
}
