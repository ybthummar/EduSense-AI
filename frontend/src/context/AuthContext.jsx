import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('edusense_token')
    const userData = localStorage.getItem('edusense_user')
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch {
        localStorage.removeItem('edusense_token')
        localStorage.removeItem('edusense_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password })
      const { access_token, user: userData } = res.data
      localStorage.setItem('edusense_token', access_token)
      localStorage.setItem('edusense_user', JSON.stringify(userData))
      setUser(userData)
      return { success: true, user: userData }
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Login failed' }
    }
  }

  const signup = async (name, email, password) => {
    try {
      const res = await api.post('/auth/signup', { name, email, password, role: 'student' })
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Signup failed' }
    }
  }

  const logout = () => {
    localStorage.removeItem('edusense_token')
    localStorage.removeItem('edusense_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
