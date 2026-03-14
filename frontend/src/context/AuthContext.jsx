import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import {
  auth as firebaseAuth,
  googleProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  isFirebaseConfigured,
} from '../services/firebase'

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

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !firebaseAuth || !googleProvider) {
      return { success: false, error: 'Firebase is not configured. Please add Firebase credentials to .env' }
    }
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider)
      const idToken = await result.user.getIdToken()
      const userData = {
        id: result.user.uid,
        email: result.user.email,
        name: result.user.displayName || result.user.email,
        role: 'student',
        photoURL: result.user.photoURL,
        authProvider: 'firebase',
      }
      localStorage.setItem('edusense_token', idToken)
      localStorage.setItem('edusense_user', JSON.stringify(userData))
      setUser(userData)
      return { success: true, user: userData }
    } catch (err) {
      return { success: false, error: err.message || 'Google sign-in failed' }
    }
  }

  const signup = async (name, email, password) => {
    try {
      await api.post('/auth/signup', { name, email, password, role: 'student' })
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Signup failed' }
    }
  }

  const logout = () => {
    localStorage.removeItem('edusense_token')
    localStorage.removeItem('edusense_user')
    if (isFirebaseConfigured && firebaseAuth) {
      firebaseSignOut(firebaseAuth).catch(() => {})
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
