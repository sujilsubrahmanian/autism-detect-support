import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { selectIsAuthenticated } from '../store/authSlice'

/** Renders child routes only for a logged-in doctor; otherwise redirects to /login
 *  and remembers where the user was heading. (UI convenience only - the real
 *  protection is the API rejecting requests without a valid token.) */
export default function ProtectedRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}
