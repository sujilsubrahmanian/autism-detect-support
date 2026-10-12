import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { errorMessage, fieldErrors } from '../api/client'
import Field from '../components/Field'
import { IconCalendar, IconClipboard, IconShield } from '../components/Icons'
import { createPatient } from '../store/patientsSlice'
import { btnLg, btnPrimary, card, display, eyebrow } from '../ui'

const TIPS = [
  [IconClipboard, 'ID is generated for you.', 'A patient ID like ASD-000012 is created by the server when you save.'],
  [IconCalendar, 'Date of birth, not age.', 'Age is calculated at each assessment, so it is always correct.'],
  [IconShield, 'Private to you.', 'No phone, address or national ID is stored, and other doctors cannot see this record.'],
]

export default function PatientNewPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', date_of_birth: '', sex: 'M', guardian_name: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    setFormError(null)
    const result = await dispatch(createPatient(form))
    setSaving(false)
    if (createPatient.fulfilled.match(result)) {
      navigate(`/app/patients/${result.payload.public_id}`)
    } else {
      setErrors(fieldErrors(result.payload))
      setFormError(errorMessage(result.payload?.data) || 'Could not save the patient.')
    }
  }

  return (
    <>
      <p className="mb-4 text-sm text-muted"><Link to="/app" className="hover:text-brand">Dashboard</Link> / Add patient</p>
      <p className={eyebrow}>New record</p>
      <h1 className={`${display} text-3xl sm:text-4xl`}>Add a patient</h1>
      <p className="mb-6 mt-1 text-muted">Only what the assessment needs is stored.</p>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <form className={`${card} grid gap-4 p-5 sm:p-7`} onSubmit={submit}>
          <Field label="Child's full name" required value={form.name} onChange={set('name')} error={errors.name} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date of birth" type="date" required max={new Date().toISOString().slice(0, 10)} value={form.date_of_birth} onChange={set('date_of_birth')} error={errors.date_of_birth} />
            <Field as="select" label="Sex" value={form.sex} onChange={set('sex')} error={errors.sex}>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </Field>
          </div>
          <Field label="Parent / guardian (optional)" value={form.guardian_name} onChange={set('guardian_name')} error={errors.guardian_name} />
          {formError && <p role="alert" className="rounded-xl border border-rose/30 bg-rose/10 px-4 py-3 text-sm text-rose">{formError}</p>}
          <button className={`${btnPrimary} ${btnLg}`} type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save patient'}</button>
        </form>

        <aside aria-label="Good to know" className="rounded-2xl bg-gradient-to-br from-[#0f2b33] to-[#123c45] p-6 text-[#d4e5e8]">
          <h2 className={`${display} text-xl text-white`}>Good to know</h2>
          <ul className="mt-4 grid gap-4">
            {TIPS.map(([Icon, title, text]) => (
              <li key={title} className="flex gap-3 text-sm leading-relaxed">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-saffron"><Icon size={18} /></span>
                <span><strong className="text-white">{title}</strong> {text}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  )
}
