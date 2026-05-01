import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import { useAuthStore } from '@/store/auth.store'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api/v1'

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

// ─── Request interceptor: attach JWT ────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor: handle 401 + token refresh ───────────────────────
let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(apiClient(original))
          })
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
        const newToken = data.data.accessToken

        useAuthStore.getState().setTokens(newToken, data.data.refreshToken)

        refreshQueue.forEach((cb) => cb(newToken))
        refreshQueue = []

        original.headers.Authorization = `Bearer ${newToken}`
        return apiClient(original)
      } catch {
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export type ApiResponse<T> = {
  success: boolean
  data: T
  meta?: {
    total: number
    page: number
    perPage: number
    lastPage: number
  }
}

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res: AxiosResponse<ApiResponse<T>> = await apiClient.get(url, { params })
  return res.data.data
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const res: AxiosResponse<ApiResponse<T>> = await apiClient.post(url, body)
  return res.data.data
}

export async function put<T>(url: string, body?: unknown): Promise<T> {
  const res: AxiosResponse<ApiResponse<T>> = await apiClient.put(url, body)
  return res.data.data
}

export async function del<T>(url: string): Promise<T> {
  const res: AxiosResponse<ApiResponse<T>> = await apiClient.delete(url)
  return res.data.data
}

export async function getPaginated<T>(
  url: string,
  params?: Record<string, unknown>
): Promise<{ data: T[]; meta: ApiResponse<T[]>['meta'] }> {
  const res: AxiosResponse<ApiResponse<T[]>> = await apiClient.get(url, { params })
  return { data: res.data.data, meta: res.data.meta }
}

// Convenience object used by pages/hooks that prefer `api.get(...)` style
export const api = { get, post, put, del, getPaginated }
