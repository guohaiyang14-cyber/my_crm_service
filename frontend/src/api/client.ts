import { toast, type ToastType } from '../composables/useToast'

const BASE = import.meta.env.VITE_API_BASE || ''

type ApiErrorDetails = string[]

interface ApiErrorOptions {
  status: number
  code: string
  message: string
  details?: ApiErrorDetails
}

export class ApiError extends Error {
  status: number
  code: string
  details: ApiErrorDetails

  constructor({ status, code, message, details = [] }: ApiErrorOptions) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

interface ApiErrorPayload {
  code?: string
  message?: string
  details?: ApiErrorDetails
}

interface RequestOptions extends Omit<RequestInit, 'headers'> {
  silent?: boolean
  onError?: (error: ApiError) => void
  headers?: HeadersInit
}

function getToken() {
  return localStorage.getItem('auth_token')
}

function defaultOnError(err: ApiError): void {
  if (err.status === 0) {
    toast('无法连接后端，请检查服务是否启动', 'error')
    return
  }
  if (err.status === 401) {
    toast('登录已失效', 'warning')
    return
  }
  if (err.status >= 500) {
    toast('服务异常，请稍后重试', 'error')
    return
  }
  toast(err.message || '请求失败', 'error')
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { silent = false, onError = defaultOnError, ...init } = options
  const headers = new Headers(init.headers)

  if (typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers })
  } catch {
    const err = new ApiError({ status: 0, code: 'NETWORK_ERROR', message: '无法连接服务器' })
    if (!silent) onError(err)
    throw err
  }

  const text = await res.text()
  let payload: unknown = null

  if (text) {
    try {
      payload = JSON.parse(text) as T
    } catch {
      payload = null
    }
  }

  if (!res.ok) {
    const e = (payload as { error?: ApiErrorPayload })?.error ?? {}
    const err = new ApiError({
      status: res.status,
      code: e.code || 'UNKNOWN_ERROR',
      message: e.message || `HTTP ${res.status}`,
      details: e.details || [],
    })

    if (res.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      // 触发全局事件，通知路由跳转（避免直接 import router 导致的循环依赖）
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))

      if (!window.location.pathname.startsWith('/login')) {
        toast('登录已失效，请重新登录', 'warning')
      }
    }

    if (!silent) onError(err)
    throw err
  }

  return payload as T
}

export type { ToastType }
