import { useEffect, useState } from 'react'
import { api, errorMessage, fieldErrors } from '../api/client'
import { btnPrimary, card } from '../ui'
import Field from './Field'

const PREGNANCY = [
  ['blood_sugar_mg_dl', 'Blood sugar (mg/dL)', '0.1'],
  ['previous_abortions', 'Previous abortions', '1'],
  ['bmi', 'Maternal BMI', '0.1'],
  ['systolic_bp', 'Systolic BP (mmHg)', '1'],
  ['diastolic_bp', 'Diastolic BP (mmHg)', '1'],
]
const MILESTONES = [
  ['birth_weight_kg', 'Birth weight (kg)', '0.01'],
  ['lifting_head_month', 'Lifted head (months)', '1'],
  ['rolling_over_month', 'Rolled over (months)', '1'],
  ['sitting_up_month', 'Sat up (months)', '1'],
  ['crawling_month', 'Crawled (months)', '1'],
  ['standing_with_support_month', 'Stood with support (months)', '1'],
  ['standing_individually_month', 'Stood alone (months)', '1'],
]

const toForm = (obj = {}) => Object.fromEntries(Object.entries(obj ?? {}).map(([k, v]) => [k, v ?? '']))
const toPayload = (form) =>
  Object.fromEntries(Object.entries(form).map(([k, v]) => [k, typeof v === 'boolean' ? v : v === '' ? null : Number(v)]))

export default function HistoryForm({ publicId }) {
  const [pregnancy, setPregnancy] = useState({})
  const [milestones, setMilestones] = useState({ premature_birth: false })
  const [status, setStatus] = useState('loading') // loading | idle | saving | saved | error
  const [error, setError] = useState(null)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    let cancelled = false
    api
      .get(`/patients/${publicId}/history/`)
      .then((data) => {
        if (cancelled) return
        setPregnancy(toForm(data.pregnancy))
        setMilestones({ premature_birth: false, ...toForm(data.milestones) })
        setStatus('idle')
      })
      .catch((err) => {
        if (cancelled) return
        setError(errorMessage(err.data) || 'Could not load history.')
        setStatus('error')
      })
    return () => {
      cancelled = true // avoid setting state after unmount
    }
  }, [publicId])

  const save = async (event) => {
    event.preventDefault()
    setStatus('saving')
    setError(null)
    setErrors({})
    try {
      await api.put(`/patients/${publicId}/history/`, { pregnancy: toPayload(pregnancy), milestones: toPayload(milestones) })
      setStatus('saved')
    } catch (err) {
      const nested = fieldErrors(err)
      setErrors({ ...nested.pregnancy, ...nested.milestones })
      setError('Please correct the highlighted fields.')
      setStatus('error')
    }
  }

  if (status === 'loading') return <p className="text-muted">Loading history…</p>

  const grid = 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'
  return (
    <form className="grid gap-4" onSubmit={save} aria-label="Clinical history">
      <fieldset className={`${card} min-w-0 p-5 sm:p-6`}>
        <legend className="mb-3 font-display text-xl font-semibold">Pregnancy</legend>
        <div className={grid}>
          {PREGNANCY.map(([key, label, step]) => (
            <Field key={key} label={label} type="number" step={step} value={pregnancy[key] ?? ''} error={errors[key]}
              onChange={(e) => setPregnancy((p) => ({ ...p, [key]: e.target.value }))} />
          ))}
        </div>
      </fieldset>
      <fieldset className={`${card} min-w-0 p-5 sm:p-6`}>
        <legend className="mb-3 font-display text-xl font-semibold">Birth and milestones</legend>
        <div className={grid}>
          {MILESTONES.map(([key, label, step]) => (
            <Field key={key} label={label} type="number" step={step} value={milestones[key] ?? ''} error={errors[key]}
              onChange={(e) => setMilestones((m) => ({ ...m, [key]: e.target.value }))} />
          ))}
        </div>
        <label className="mt-4 flex items-center gap-2 font-medium">
          <input type="checkbox" className="size-4 accent-brand" checked={Boolean(milestones.premature_birth)}
            onChange={(e) => setMilestones((m) => ({ ...m, premature_birth: e.target.checked }))} />
          Premature birth
        </label>
      </fieldset>
      {error && <p role="alert" className="rounded-xl border border-rose/30 bg-rose/10 px-4 py-3 text-sm text-rose">{error}</p>}
      {status === 'saved' && <p role="status" className="rounded-xl border border-low/30 bg-low/10 px-4 py-3 text-sm text-low">History saved.</p>}
      <div className="flex flex-wrap items-center gap-4">
        <button className={btnPrimary} type="submit" disabled={status === 'saving'}>{status === 'saving' ? 'Saving…' : 'Save history'}</button>
        <p className="text-sm text-muted">Clinical context only. These fields are not used by the prediction model.</p>
      </div>
    </form>
  )
}
