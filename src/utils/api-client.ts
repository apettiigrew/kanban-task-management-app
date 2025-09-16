import { getSession } from "next-auth/react"
import { SortType } from "./data"

export interface ApiRequestConfig extends RequestInit {
  requireAuth?: boolean
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    return headers
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage: string

      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.error || errorData.message || 'An error occurred'
      } catch {
        errorMessage = errorText || response.statusText
      }

      throw new ApiError(errorMessage, response.status, response.statusText)
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json()
    }

    return response.text() as unknown as T
  }

  async request<T>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    const { requireAuth = true, ...fetchConfig } = config

    const url = `${this.baseUrl}${endpoint}`

    try {
      const headers = requireAuth
        ? await this.getAuthHeaders()
        : { 'Content-Type': 'application/json' }

      const response = await fetch(url, {
        ...fetchConfig,
        headers: {
          ...headers,
          ...fetchConfig.headers,
        },
      })

      return this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      console.error('API request error:', error)
      throw new ApiError(
        'Network error occurred',
        0,
        'Network Error'
      )
    }
  }

  // Convenience methods
  async get<T>(endpoint: string, config?: ApiRequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' })
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    config?: ApiRequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    config?: ApiRequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    config?: ApiRequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string, config?: ApiRequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' })
  }
}

// Default API client instance
export const apiClient = new ApiClient('/api')

// Export individual methods for convenience
export const { get, post, put, patch, delete: del } = apiClient


export const sortColumns = async (projectId: string, sortType: SortType) => {
  return apiClient.post(`/projects/${projectId}/sort`, { sortType })
}
