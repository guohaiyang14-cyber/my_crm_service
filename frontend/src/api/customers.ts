import { request } from './client'

export type CustomerStatus = 'LEAD' | 'FOLLOWING' | 'WON' | 'LOST'

export interface Customer {
  id: number
  name: string
  company: string | null
  phone: string | null
  wechat: string | null
  source: string | null
  status: CustomerStatus
  notes: string | null
  nextFollowUpAt: string | null
  createdAt: string
  updatedAt: string
  ownerId: number
}

export interface CustomerListResponse {
  data: Customer[]
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export interface CustomerPayload {
  name: string
  company?: string | null
  phone?: string | null
  wechat?: string | null
  source?: string | null
  status?: CustomerStatus
  notes?: string | null
}

export const customersApi = {
  list: async (
    params: { search?: string; status?: CustomerStatus; page?: number; pageSize?: number } = {}
  ) => {
    const query = new URLSearchParams()
    if (params.search) query.set('search', params.search)
    if (params.status) query.set('status', params.status)
    if (params.page) query.set('page', String(params.page))
    if (params.pageSize) query.set('pageSize', String(params.pageSize))

    return request<CustomerListResponse>(
      `/api/customers${query.toString() ? `?${query.toString()}` : ''}`,
      {
        silent: true,
      }
    )
  },

  create: async (payload: CustomerPayload) => {
    return request<{ data: Customer }>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
      silent: true,
    })
  },

  update: async (id: number, payload: Partial<CustomerPayload>) => {
    return request<{ data: Customer }>(`/api/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      silent: true,
    })
  },

  remove: async (id: number) => {
    return request<void>(`/api/customers/${id}`, {
      method: 'DELETE',
      silent: true,
    })
  },
}
