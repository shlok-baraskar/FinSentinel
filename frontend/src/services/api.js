import axios from 'axios'

const BASE_URL = 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fs_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle expired/invalid tokens globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fs_token')
      localStorage.removeItem('fs_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── Transactions ─────────────────────────────────────────────────────────────
export const analyzeTransaction = (data) =>
  api.post('/transactions/analyze', data)

export const getTransactions = (skip = 0, limit = 50) =>
  api.get(`/transactions?skip=${skip}&limit=${limit}`)

export const getTransaction = (id) =>
  api.get(`/transactions/${id}`)

// ─── Alerts ───────────────────────────────────────────────────────────────────
export const getAlerts = (skip = 0, limit = 50) =>
  api.get(`/alerts?skip=${skip}&limit=${limit}`)

// ─── Stats & Metrics ──────────────────────────────────────────────────────────
export const getDashboardStats = () =>
  api.get('/stats')

export const getModelMetrics = () =>
  api.get('/model/metrics')

export const healthCheck = () =>
  api.get('/health')

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const signup = (data) =>
  api.post('/auth/signup', data)

export const login = (data) =>
  api.post('/auth/login', data)

export const getMe = () =>
  api.get('/auth/me')

// ─── User Management (Admin only) ──────────────────────────────────────────────
export const getAllUsers = () =>
  api.get('/users/')

export const updateUserRole = (userId, newRole) =>
  api.patch(`/users/${userId}/role?new_role=${newRole}`)

export const toggleUserStatus = (userId) =>
  api.patch(`/users/${userId}/status`)

// ─── Batch Upload ───────────────────────────────────────────────────────────────
export const uploadBatchFile = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/transactions/batch-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// ─── Admin creation (Super Admin only) ──────────────────────────────────────────
export const createAdminUser = (data) =>
  api.post('/users/create-admin', data)


// ─── Simulator ──────────────────────────────────────────────────────────────────
export const startSimulator  = (interval = 3.0) =>
  api.post(`/simulator/start?interval=${interval}`)

export const stopSimulator   = () =>
  api.post('/simulator/stop')

export const simulatorStatus = () =>
  api.get('/simulator/status')