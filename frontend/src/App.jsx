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
    <div className="min-h-screen bg-surface-950 flex items-center justify-center bg-gradient-mesh">
      <div className="flex flex-col items-center gap-5 animate-fade-in-up">
        <div className="relative">
          <div className="w-14 h-14 border-[3px] border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">E</span>
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-surface-300 text-sm font-medium">Loading EduSense AI</p>
          <p className="text-surface-500 text-xs mt-1">Preparing your dashboard...</p>
        </div>
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
