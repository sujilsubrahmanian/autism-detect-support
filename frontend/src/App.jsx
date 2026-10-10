import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import NotFoundPage from './pages/NotFoundPage'

// Temporary home screen: the real patient screens arrive in the next step.
function Placeholder() {
  return (
    <>
      <h1>Dashboard</h1>
      <p className="muted">The patient screens arrive in the next step.</p>
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Placeholder />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
