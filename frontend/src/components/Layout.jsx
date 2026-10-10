import { useDispatch, useSelector } from 'react-redux'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { logout } from '../store/authSlice'
import Avatar from './Avatar'
import { Logo } from './Brand'
import { IconGrid, IconLogout, IconUserPlus } from './Icons'

export default function Layout() {
  const user = useSelector((s) => s.auth.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const signOut = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="shell">
      <aside className="rail">
        <div className="rail__brand">
          <Logo size={34} />
          <span>Autism Detection<br />Support</span>
        </div>

        <nav className="rail__nav" aria-label="Main">
          <NavLink to="/" end>
            <IconGrid size={19} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/patients/new">
            <IconUserPlus size={19} />
            <span>Add patient</span>
          </NavLink>
        </nav>

        <p className="rail__note">Screening aid for clinicians. Not a diagnosis.</p>

        <div className="rail__user">
          <Avatar name={user?.full_name ?? ''} size={40} />
          <div className="rail__who">
            <p className="rail__name">{user?.full_name}</p>
            <p className="rail__role">{user?.specialty}</p>
          </div>
          <button className="rail__logout" onClick={signOut} aria-label="Sign out" title="Sign out">
            <IconLogout size={19} />
          </button>
        </div>
      </aside>
      <main className="main">
        <div className="main__inner">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
