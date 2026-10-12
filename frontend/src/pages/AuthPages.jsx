import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { BrandName } from '../components/Brand'
import Field from '../components/Field'
import { IconArrowRight } from '../components/Icons'
import { clearAuthError, login, registerDoctor, selectIsAuthenticated } from '../store/authSlice'
import { btnLg, btnOutline, btnPrimary, card, display } from '../ui'

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-8">
      <div aria-hidden="true" className="absolute -left-24 -top-24 -z-10 size-96 rounded-full bg-brand/20 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-24 -right-24 -z-10 size-96 rounded-full bg-saffron/25 blur-3xl" />
      <div className="w-full max-w-md animate-rise">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" aria-label="Home"><BrandName /></Link>
          <Link to="/" className="text-sm font-semibold text-muted hover:text-brand">&larr; Back to home</Link>
        </div>
        <div className={`${card} p-6 sm:p-8`}>
          <h1 className={`${display} text-3xl`}>{title}</h1>
          <p className="mb-6 mt-1 text-muted">{subtitle}</p>
          {children}
        </div>
        <p className="mt-5 text-center text-sm text-muted">{footer}</p>
      </div>
    </div>
  )
}

const errorBox = 'rounded-xl border border-rose/30 bg-rose/10 px-4 py-3 text-sm text-rose'
const linkCls = 'font-semibold text-brand underline underline-offset-4'

export function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { status, error } = useSelector((s) => s.auth)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const [form, setForm] = useState({ username: '', password: '' })
  const target = location.state?.from?.pathname ?? '/app'

  if (isAuthenticated) return <Navigate to={target} replace />

  const submit = async (event) => {
    event.preventDefault()
    const result = await dispatch(login(form))
    if (login.fulfilled.match(result)) navigate(target, { replace: true })
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to your patients."
      footer={<>New here? <Link className={linkCls} to="/register" onClick={() => dispatch(clearAuthError())}>Create a doctor account</Link></>}
    >
      <form className="grid gap-4" onSubmit={submit}>
        <Field label="Username" autoComplete="username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <Field label="Password" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p role="alert" className={errorBox}>{error}</p>}
        <button className={`${btnPrimary} ${btnLg}`} type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Signing in…' : 'Sign in'} <IconArrowRight size={18} />
        </button>
        <button type="button" className={`${btnOutline} ${btnLg} !border-dashed`} onClick={() => setForm({ username: 'demo_doctor', password: 'DemoPass!234' })}>
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
  const [form, setForm] = useState({ first_name: '', last_name: '', username: '', email: '', password: '', specialty: 'pediatrician' })
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const submit = async (event) => {
    event.preventDefault()
    const result = await dispatch(registerDoctor(form))
    if (registerDoctor.fulfilled.match(result)) navigate('/app', { replace: true })
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="For clinicians. Your patients stay private to you."
      footer={<>Already registered? <Link className={linkCls} to="/login">Sign in</Link></>}
    >
      <form className="grid gap-4" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" required value={form.first_name} onChange={set('first_name')} />
          <Field label="Last name" required value={form.last_name} onChange={set('last_name')} />
        </div>
        <Field label="Username" autoComplete="username" required value={form.username} onChange={set('username')} />
        <Field label="Email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
        <Field label="Password" type="password" autoComplete="new-password" required minLength={8} hint="At least 8 characters, not a common password." value={form.password} onChange={set('password')} />
        <Field as="select" label="Specialty" value={form.specialty} onChange={set('specialty')}>
          <option value="pediatrician">Pediatrician</option>
          <option value="psychologist">Psychologist</option>
          <option value="psychiatrist">Psychiatrist</option>
          <option value="other">Other</option>
        </Field>
        {error && <p role="alert" className={errorBox}>{error}</p>}
        <button className={`${btnPrimary} ${btnLg}`} type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  )
}
