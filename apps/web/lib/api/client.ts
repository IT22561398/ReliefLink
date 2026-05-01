'use client'

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
} from 'axios'
import { toast } from '@/hooks/use-toast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''

function normalizeBaseUrl(baseUrl: string): string {
  if (!baseUrl || baseUrl === '/') return ''
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
}

function normalizeApiPath(path: string): string {
  const normalizedBaseUrl = normalizeBaseUrl(API_BASE_URL)

  if (normalizedBaseUrl === '/api' && path.startsWith('/api/')) {
    return path.slice('/api'.length)
  }

  return path
}

interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

interface SuccessResponse<T> {
  success: true
  data: T
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: normalizeBaseUrl(API_BASE_URL),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorResponse>) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        window.location.replace('/login')
      }
    }

    const errorMessage =
      error.response?.data?.error?.message ||
      error.message ||
      'An error occurred'

    if (!error.config?.headers['no-toast']) {
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    }

    return Promise.reject(error)
  },
)

export async function apiRequest<T = unknown>(
  config: AxiosRequestConfig & { 'no-toast'?: boolean },
): Promise<T> {
  try {
    const response = await apiClient.request<ApiResponse<T>>(config)
    if (response.data.success) {
      return response.data.data
    }
    throw new ApiError(
      response.data.error?.message || 'An error occurred',
      500,
      response.data.error?.code,
    )
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new ApiError(
        error.response?.data?.error?.message || error.message || 'An error occurred',
        error.response?.status || 500,
        error.response?.data?.error?.code,
      )
    }
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'An unknown error occurred',
      500,
    )
  }
}

export async function apiGet<T = unknown>(
  path: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  return apiRequest<T>({ ...config, method: 'GET', url: normalizeApiPath(path) })
}

export async function apiPost<T = unknown>(
  path: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  return apiRequest<T>({ ...config, method: 'POST', url: normalizeApiPath(path), data })
}

export async function apiPut<T = unknown>(
  path: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  return apiRequest<T>({ ...config, method: 'PUT', url: normalizeApiPath(path), data })
}

export async function apiPatch<T = unknown>(
  path: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  return apiRequest<T>({ ...config, method: 'PATCH', url: normalizeApiPath(path), data })
}

export async function apiDelete<T = unknown>(
  path: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  return apiRequest<T>({ ...config, method: 'DELETE', url: normalizeApiPath(path) })
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('auth_token', token)
  } else {
    localStorage.removeItem('auth_token')
  }
}

export default apiClient

// Legacy support
export async function apiFetch<T>(
  baseUrl: string,
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = getAuthToken()
  const headers = new Headers(options?.headers)
  headers.set('Content-Type', 'application/json')

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const payload = await response.text()
    throw new Error(payload || `HTTP ${response.status}`)
  }

  return (await response.json()) as T
}
