import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import BottomNav from './components/layout/BottomNav'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Applications from './pages/Applications'
import Interviews from './pages/Interviews'
import Resume from './pages/Resume'
import Intelligence from './pages/Intelligence'
import Tasks from './pages/Tasks'
import CareerReadiness from './pages/CareerReadiness'
import Opportunities from './pages/Opportunities'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import AdminRoute from './components/AdminRoute'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminInstitution from './pages/admin/AdminInstitution'
import AdminStudentDirectory from './pages/admin/AdminStudentDirectory'
import AdminStudentProfile from './pages/admin/AdminStudentProfile'
import AdminIntelligence from './pages/admin/AdminIntelligence'
import AdminInterventions from './pages/admin/AdminInterventions'
import AdminEmployers from './pages/admin/AdminEmployers'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminOfficers from './pages/admin/AdminOfficers'
import AdminMentors from './pages/admin/AdminMentors'
import AdminOfficerDetails from './pages/admin/AdminOfficerDetails'
import AdminLayout from './components/layout/AdminLayout'
import SuperAdminRoute from './components/SuperAdminRoute'
import SuperAdminGuestRoute from './components/SuperAdminGuestRoute'
import SuperAdminLogin from './pages/super-admin/SuperAdminLogin'
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard'
import SuperAdminInstitutions from './pages/super-admin/SuperAdminInstitutions'
import SuperAdminInstitutionDetails from './pages/super-admin/SuperAdminInstitutionDetails'
import SuperAdminSettings from './pages/super-admin/SuperAdminSettings'
import SuperAdminLayout from './components/layout/SuperAdminLayout'
import MentorRoute from './components/MentorRoute'
import OfficerRoute from './components/OfficerRoute'
import MentorLayout from './components/layout/MentorLayout'
import OfficerLayout from './components/layout/OfficerLayout'
import MentorDashboard from './pages/mentor/MentorDashboard'
import MentorStudents from './pages/mentor/MentorStudents'
import MentorStudentProfile from './pages/mentor/MentorStudentProfile'
import MentorApplications from './pages/mentor/MentorApplications'
import MentorInterviews from './pages/mentor/MentorInterviews'
import MentorInterventions from './pages/mentor/MentorInterventions'
import MentorNotes from './pages/mentor/MentorNotes'
import MentorProgress from './pages/mentor/MentorProgress'
import MentorIntelligence from './pages/mentor/MentorIntelligence'
import OfficerDashboard from './pages/officer/OfficerDashboard'
import OfficerMentors from './pages/officer/OfficerMentors'
import OfficerMentorDetails from './pages/officer/OfficerMentorDetails'
import OfficerStudents from './pages/officer/OfficerStudents'
import OfficerStudentProfile from './pages/officer/OfficerStudentProfile'
import OfficerApplications from './pages/officer/OfficerApplications'
import OfficerInterviews from './pages/officer/OfficerInterviews'
import OfficerInterventions from './pages/officer/OfficerInterventions'
import OfficerAnalytics from './pages/officer/OfficerAnalytics'
import OfficerIntelligence from './pages/officer/OfficerIntelligence'
import AdminPlacementDrives from './pages/admin/AdminPlacementDrives'
import AdminPlacementReports from './pages/admin/AdminPlacementReports'
import AdminPlacementVerification from './pages/admin/AdminPlacementVerification'
import AdminPlacementAudit from './pages/admin/AdminPlacementAudit'
import OfficerPlacementDrives from './pages/officer/OfficerPlacementDrives'
import PlacementDrives from './pages/PlacementDrives'
import { useLocation } from 'react-router-dom'
import './index.css'

// Redirects authenticated users away from /login and /register
const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

const AdminGuestRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth()
  if (loading) return null
  if (isAuthenticated) {
    if (user?.role === 'SUPER_ADMIN') {
      return <Navigate to="/super-admin/dashboard" replace />
    }
    if (user?.role === 'PLACEMENT_OFFICER') {
      return <Navigate to="/officer/dashboard" replace />
    }
    if (user?.role === 'MENTOR') {
      return <Navigate to="/mentor/dashboard" replace />
    }
    if (user?.role !== 'STUDENT') {
      return <Navigate to="/admin/dashboard" replace />
    }
    return <Navigate to="/dashboard" replace />
  }
  return children
}

const AdminRootRedirect = () => {
  return <Navigate to="/admin/dashboard" replace />;
};

function AppRoutes() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';
  const isSuperAdminRoute = location.pathname.startsWith('/super-admin');
  const isMentorRoute = location.pathname.startsWith('/mentor');
  const isOfficerRoute = location.pathname.startsWith('/officer');
  const hideNavbar = isAdminRoute || isSuperAdminRoute || isMentorRoute || isOfficerRoute;

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />

        {/* Guest-only (redirect if already logged in) */}
        {/* Guest-only (redirect if already logged in) */}
        <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
        <Route path="/reset-password/:token" element={<GuestRoute><ResetPassword /></GuestRoute>} />

        {/* Protected */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
        <Route path="/interviews" element={<ProtectedRoute><Interviews /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path="/resume" element={<ProtectedRoute><Resume /></ProtectedRoute>} />
        <Route path="/intelligence" element={<ProtectedRoute><Intelligence /></ProtectedRoute>} />
        <Route path="/readiness" element={<ProtectedRoute><CareerReadiness /></ProtectedRoute>} />
        <Route path="/opportunities" element={<ProtectedRoute><Opportunities /></ProtectedRoute>} />
        <Route path="/placement-drives" element={<ProtectedRoute><PlacementDrives /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* Admin Portal */}
        <Route path="/admin/login" element={<AdminGuestRoute><AdminLogin /></AdminGuestRoute>} />
        
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/students" element={<AdminRoute><AdminStudentDirectory /></AdminRoute>} />
          <Route path="/admin/students/:id" element={<AdminRoute><AdminStudentProfile /></AdminRoute>} />
          <Route path="/admin/officers" element={<AdminRoute><AdminOfficers /></AdminRoute>} />
          <Route path="/admin/officers/:id" element={<AdminRoute><AdminOfficerDetails /></AdminRoute>} />
          <Route path="/admin/mentors" element={<AdminRoute><AdminMentors /></AdminRoute>} />
          <Route path="/admin/interventions" element={<AdminRoute><AdminInterventions /></AdminRoute>} />
          <Route path="/admin/intelligence" element={<AdminRoute><AdminIntelligence /></AdminRoute>} />
          <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
          <Route path="/admin/institution" element={<AdminRoute><AdminInstitution /></AdminRoute>} />
          <Route path="/admin/placement-drives" element={<AdminRoute><AdminPlacementDrives /></AdminRoute>} />
          <Route path="/admin/placement-reports" element={<AdminRoute><AdminPlacementReports /></AdminRoute>} />
          <Route path="/admin/placement-verification" element={<AdminRoute><AdminPlacementVerification /></AdminRoute>} />
          <Route path="/admin/placement-audit" element={<AdminRoute><AdminPlacementAudit /></AdminRoute>} />
          <Route path="/admin/settings" element={<Navigate to="/admin/institution" replace />} />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminRootRedirect />
            </AdminRoute>
          } />
        </Route>

        {/* Super Admin Portal */}
        <Route path="/super-admin/login" element={<SuperAdminGuestRoute><SuperAdminLogin /></SuperAdminGuestRoute>} />
        
        <Route element={<SuperAdminLayout />}>
          <Route path="/super-admin/dashboard" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
          <Route path="/super-admin/institutions" element={<SuperAdminRoute><SuperAdminInstitutions /></SuperAdminRoute>} />
          <Route path="/super-admin/institutions/:id" element={<SuperAdminRoute><SuperAdminInstitutionDetails /></SuperAdminRoute>} />
          <Route path="/super-admin/settings" element={<SuperAdminRoute><SuperAdminSettings /></SuperAdminRoute>} />
          <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
        </Route>

        {/* Mentor Portal */}
        <Route element={<MentorLayout />}>
          <Route path="/mentor/dashboard" element={<MentorRoute><MentorDashboard /></MentorRoute>} />
          <Route path="/mentor/students" element={<MentorRoute><MentorStudents /></MentorRoute>} />
          <Route path="/mentor/students/:id" element={<MentorRoute><MentorStudentProfile /></MentorRoute>} />
          <Route path="/mentor/applications" element={<MentorRoute><MentorApplications /></MentorRoute>} />
          <Route path="/mentor/interviews" element={<MentorRoute><MentorInterviews /></MentorRoute>} />
          <Route path="/mentor/interventions" element={<MentorRoute><MentorInterventions /></MentorRoute>} />
          <Route path="/mentor/notes" element={<MentorRoute><MentorNotes /></MentorRoute>} />
          <Route path="/mentor/progress" element={<MentorRoute><MentorProgress /></MentorRoute>} />
          <Route path="/mentor/intelligence" element={<MentorRoute><MentorIntelligence /></MentorRoute>} />
          <Route path="/mentor" element={<Navigate to="/mentor/dashboard" replace />} />
        </Route>

        {/* Officer Portal */}
        <Route element={<OfficerLayout />}>
          <Route path="/officer/dashboard" element={<OfficerRoute><OfficerDashboard /></OfficerRoute>} />
          <Route path="/officer/mentors" element={<OfficerRoute><OfficerMentors /></OfficerRoute>} />
          <Route path="/officer/mentors/:id" element={<OfficerRoute><OfficerMentorDetails /></OfficerRoute>} />
          <Route path="/officer/students" element={<OfficerRoute><OfficerStudents /></OfficerRoute>} />
          <Route path="/officer/students/:id" element={<OfficerRoute><OfficerStudentProfile /></OfficerRoute>} />
          <Route path="/officer/applications" element={<OfficerRoute><OfficerApplications /></OfficerRoute>} />
          <Route path="/officer/interviews" element={<OfficerRoute><OfficerInterviews /></OfficerRoute>} />
          <Route path="/officer/interventions" element={<OfficerRoute><OfficerInterventions /></OfficerRoute>} />
          <Route path="/officer/analytics" element={<OfficerRoute><OfficerAnalytics /></OfficerRoute>} />
          <Route path="/officer/intelligence" element={<OfficerRoute><OfficerIntelligence /></OfficerRoute>} />
          <Route path="/officer/placement-drives" element={<OfficerRoute><OfficerPlacementDrives /></OfficerRoute>} />
          <Route path="/officer" element={<Navigate to="/officer/dashboard" replace />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideNavbar && <BottomNav />}
    </>
  )
}


function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <div className="min-h-screen bg-[var(--color-bg)] pb-16 sm:pb-0">
            <AppRoutes />
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
