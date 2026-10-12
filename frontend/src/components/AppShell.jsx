import { useDispatch, useSelector } from 'react-redux'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { logout } from '../store/authSlice'
import { btnPrimary, container } from '../ui'
import Avatar from './Avatar'
import { BrandName } from './Brand'
import { IconGrid, IconLogout, IconPlus, IconUserPlus } from './Icons'

const link = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${isActive ? 'bg-brand text-white shadow-md shadow-brand/25' : 'text-ink-2 hover:bg-paper-2'}`
const tab = ({ isActive }) =>
  `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${isActive ? 'text-brand' : 'text-muted'}`

/** Signed-in layout: sticky top bar on desktop, bottom tab bar on phones. */
export default function AppShell() {
  const user = useSelector((s) => s.auth.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const signOut = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-white/85 backdrop-blur">
        <div className={`${container} flex h-16 items-center gap-4`}>
          <Link to="/" aria-label="Home"><BrandName /></Link>
          <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
            <NavLink to="/app" end className={link}>Dashboard</NavLink>
            <NavLink to="/app/patients/new" className={link}>Add patient</NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/app/patients/new" className={`${btnPrimary} max-lg:hidden`}><IconPlus size={16} /> Add patient</Link>
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 hover:border-brand [&::-webkit-details-marker]:hidden">
                <Avatar name={user?.full_name ?? ''} size={34} />
                <span className="hidden max-w-[10rem] truncate text-sm font-semibold sm:block">{user?.full_name}</span>
              </summary>
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-line bg-white p-3 shadow-xl">
                <p className="truncate px-2 font-semibold">{user?.full_name}</p>
                <p className="px-2 pb-2 text-xs capitalize text-muted">{user?.specialty} · {user?.email}</p>
                <button onClick={signOut} className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-rose hover:bg-rose/10">
                  <IconLogout size={18} /> Sign out
                </button>
              </div>
            </details>
          </div>
        </div>
      </header>

      <main className={`${container} flex-1 animate-rise py-6 pb-28 md:pb-12 lg:py-10`}>
        <Outlet />
      </main>

      <nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <NavLink to="/app" end className={tab}><IconGrid size={22} />Dashboard</NavLink>
        <NavLink to="/app/patients/new" className={tab}><IconUserPlus size={22} />Add patient</NavLink>
        <button onClick={signOut} className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-muted"><IconLogout size={22} />Sign out</button>
      </nav>
    </div>
  )
}
