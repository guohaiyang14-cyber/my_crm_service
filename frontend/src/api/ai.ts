import { request } from './client'

export interface GenerateInfoPayload {
  title: string
  techStack: string[]
}

export interface GenerateInfoResponse {
  data: {
    summary: string
  }
}

export const aiApi = {
  generateInfo: async (payload: GenerateInfoPayload): Promise<GenerateInfoResponse> => {
    return request<GenerateInfoResponse>('/api/ai/generate-info', {
      method: 'POST',
      body: JSON.stringify(payload),
      silent: true,
    })
  },
}
