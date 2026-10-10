import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { HeroPanel, Logo } from '../components/Brand'
import Field from '../components/Field'
import { clearAuthError, login, registerDoctor, selectIsAuthenticated } from '../store/authSlice'

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <aside className="auth__hero">
        <HeroPanel />
      </aside>
      <main className="auth__main">
        <div className="auth__card">
          <div className="auth__logo"><Logo size={40} /></div>
          <h1>{title}</h1>
          <p className="auth__subtitle">{subtitle}</p>
          {children}
          <p className="auth__footer">{footer}</p>
        </div>
      </main>
    </div>
  )
}

export function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { status, error } = useSelector((s) => s.auth)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const [form, setForm] = useState({ username: '', password: '' })

  if (isAuthenticated) return <Navigate to={location.state?.from?.pathname ?? '/'} replace />

  const submit = async (event) => {
    event.preventDefault()
    const result = await dispatch(login(form))
    if (login.fulfilled.match(result)) navigate(location.state?.from?.pathname ?? '/', { replace: true })
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to your patients."
      footer={<>New here? <Link to="/register" onClick={() => dispatch(clearAuthError())}>Create a doctor account</Link></>}
    >
      <form className="form" onSubmit={submit}>
        <Field label="Username" autoComplete="username" required value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <Field label="Password" type="password" autoComplete="current-password" required value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="banner banner--error" role="alert">{error}</p>}
        <button className="btn btn--primary btn--large" type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Signing in…' : 'Sign in'}
        </button>
        <button type="button" className="btn btn--ghost-dark" onClick={() => setForm({ username: 'demo_doctor', password: 'DemoPass!234' })}>
          Use the demo account
        </button>
      </form>
    </AuthShell>
  )
}

export function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { status, error } = useSelector((s) => s.auth)
  const [form, setForm] = useState({
    first_name: '', last_name: '', username: '', email: '', password: '', specialty: 'pediatrician',
  })
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const submit = async (event) => {
    event.preventDefault()
    const result = await dispatch(registerDoctor(form))
    if (registerDoctor.fulfilled.match(result)) navigate('/', { replace: true })
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="For clinicians. Your patients stay private to you."
      footer={<>Already registered? <Link to="/login">Sign in</Link></>}
    >
      <form className="form" onSubmit={submit}>
        <div className="form__grid form__grid--2">
          <Field label="First name" required value={form.first_name} onChange={set('first_name')} />
          <Field label="Last name" required value={form.last_name} onChange={set('last_name')} />
        </div>
        <Field label="Username" autoComplete="username" required value={form.username} onChange={set('username')} />
        <Field label="Email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
        <Field label="Password" type="password" autoComplete="new-password" required minLength={8}
          hint="At least 8 characters, not a common password." value={form.password} onChange={set('password')} />
        <Field as="select" label="Specialty" value={form.specialty} onChange={set('specialty')}>
          <option value="pediatrician">Pediatrician</option>
          <option value="psychologist">Psychologist</option>
          <option value="psychiatrist">Psychiatrist</option>
          <option value="other">Other</option>
        </Field>
        {error && <p className="banner banner--error" role="alert">{error}</p>}
        <button className="btn btn--primary btn--large" type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  )
}
