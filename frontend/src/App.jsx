import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import FacultyStudentsPage from './pages/FacultyStudentsPage';
import FacultyAttendancePage from './pages/FacultyAttendancePage';
import FacultyPerformancePage from './pages/FacultyPerformancePage';
import StudentDashboard from './pages/StudentDashboard';
import StudentResourcesPage from './pages/StudentResourcesPage';
import StudentReviewsPage from './pages/StudentReviewsPage';
import FacultyResourcesPage from './pages/FacultyResourcesPage';
import WeeklyReportPage from './pages/WeeklyReportPage';
import ChatPage from './pages/ChatPage';
import DashboardLayout from './layouts/DashboardLayout';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }
  return children;
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-rise-in flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin" />
        </div>
        <p className="text-sm text-slate-400">Loading your workspace...</p>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to={`/${user.role}`} replace /> : <SignupPage />} />

      {/* Admin Routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/faculty" element={<AdminDashboard />} />
        <Route path="/admin/students" element={<AdminDashboard />} />
        <Route path="/admin/departments" element={<AdminDashboard />} />
        <Route path="/admin/analytics" element={<AdminDashboard />} />
      </Route>

      {/* Faculty Routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/faculty" element={<FacultyDashboard />} />
        <Route path="/faculty/students" element={<FacultyStudentsPage />} />
        <Route path="/faculty/performance" element={<FacultyPerformancePage />} />
        <Route path="/faculty/attendance" element={<FacultyAttendancePage />} />
        <Route path="/faculty/resources" element={<FacultyResourcesPage />} />
      </Route>

      {/* Student Routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/performance" element={<StudentDashboard />} />
        <Route path="/student/quizzes" element={<StudentDashboard />} />
        <Route path="/student/resources" element={<StudentResourcesPage />} />
        <Route path="/student/reviews" element={<StudentReviewsPage />} />
        <Route path="/student/weekly-report" element={<WeeklyReportPage />} />
      </Route>

      {/* Chat - accessible by all authenticated users */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['admin', 'faculty', 'student']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/chat" element={<ChatPage />} />
      </Route>

      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
