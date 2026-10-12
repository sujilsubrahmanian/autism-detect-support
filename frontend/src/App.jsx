import { Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import ProtectedRoute from './components/ProtectedRoute'
import AssessmentPage from './pages/AssessmentPage'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import DashboardPage from './pages/DashboardPage'
import LandingPage from './pages/LandingPage'
import NotFoundPage from './pages/NotFoundPage'
import PatientDetailPage from './pages/PatientDetailPage'
import PatientNewPage from './pages/PatientNewPage'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Everything under /app requires a logged-in doctor */}
      <Route path="/app" element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="patients/new" element={<PatientNewPage />} />
          <Route path="patients/:publicId" element={<PatientDetailPage />} />
          <Route path="patients/:publicId/assess" element={<AssessmentPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
