import { createContext, useContext, useState, useEffect } from 'react'
import { login as loginApi, signup as signupApi, getMe } from './services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('fs_token')
      const savedUser = localStorage.getItem('fs_user')
      if (token && savedUser) {
        try {
          const res = await getMe()
          setUser(res.data)
        } catch {
          localStorage.removeItem('fs_token')
          localStorage.removeItem('fs_user')
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const login = async (email, password) => {
    const res = await loginApi({ email, password })
    localStorage.setItem('fs_token', res.data.access_token)
    localStorage.setItem('fs_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }

  const signup = async (full_name, email, password, role) => {
    const res = await signupApi({ full_name, email, password, role })
    localStorage.setItem('fs_token', res.data.access_token)
    localStorage.setItem('fs_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }

  const logout = () => {
    localStorage.removeItem('fs_token')
    localStorage.removeItem('fs_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}