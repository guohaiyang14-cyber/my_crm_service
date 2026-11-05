import { request } from './client'

export interface Project {
  id: number // 数据库生成的 ID 也可以加上
  slug: string
  title: string
  summary: string
  techStack: string[]
  repoUrl: string | null
  demoUrl: string | null
  featured: boolean
  createdAt: string
}

export interface ProjectCreatePayload {
  slug: string
  title: string
  summary: string
  techStack: string[]
  repoUrl: string | null
  demoUrl: string | null
  featured: boolean
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ProjectsListResponse {
  data: Project[]
  pagination?: PaginationMeta
}

export interface ProjectResponse {
  data: Project
}

// 公共的 Request 配置类型
type ApiRequestOptions = Omit<RequestInit, 'body'> & { silent?: boolean }

export const projectsApi = {
  // 1. 获取列表
  list: async (
    params: { featured?: boolean; page?: number; pageSize?: number } = {}
  ): Promise<ProjectsListResponse> => {
    const query = new URLSearchParams()
    if (params.featured !== undefined) query.append('featured', String(params.featured))
    if (params.page) query.append('page', String(params.page))
    if (params.pageSize) query.append('pageSize', String(params.pageSize))

    const qs = query.toString()
    return request<ProjectsListResponse>(`/api/projects${qs ? `?${qs}` : ''}`, { silent: true })
  },

  // 2. 获取单个详情（新增，用于编辑页回显）
  get: async (slug: string): Promise<ProjectResponse> => {
    return request<ProjectResponse>(`/api/projects/${slug}`, { silent: true })
  },

  // 3. 新增
  create: async (
    payload: ProjectCreatePayload,
    opts: ApiRequestOptions = {}
  ): Promise<ProjectResponse> => {
    return request<ProjectResponse>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
      silent: true,
      ...opts,
    })
  },

  // 4. 更新
  update: async (
    slug: string,
    payload: Partial<ProjectCreatePayload>,
    opts: ApiRequestOptions = {}
  ): Promise<ProjectResponse> => {
    return request<ProjectResponse>(`/api/projects/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      silent: true,
      ...opts,
    })
  },

  // 5. 删除
  remove: async (slug: string): Promise<ProjectResponse> => {
    return request<ProjectResponse>(`/api/projects/${slug}`, { method: 'DELETE', silent: true })
  },
}
