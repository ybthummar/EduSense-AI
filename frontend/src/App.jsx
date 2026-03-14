import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import AdminDashboard from './pages/AdminDashboard'
import FacultyDashboard from './pages/FacultyDashboard'
import StudentDashboard from './pages/StudentDashboard'
import ChatPage from './pages/ChatPage'
import DashboardLayout from './layouts/DashboardLayout'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />
  }
  return children
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-surface-400 text-sm">Loading EduSense AI...</p>
      </div>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to={`/${user.role}`} replace /> : <SignupPage />} />

      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout><AdminDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/faculty" element={
        <ProtectedRoute allowedRoles={['faculty']}>
          <DashboardLayout><FacultyDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/student" element={
        <ProtectedRoute allowedRoles={['student']}>
          <DashboardLayout><StudentDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/chat" element={
        <ProtectedRoute allowedRoles={['student']}>
          <DashboardLayout><ChatPage /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
