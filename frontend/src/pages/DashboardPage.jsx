import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { IconArrowRight, IconClipboard, IconPlus, IconSearch, IconShield, IconUsers } from '../components/Icons'
import { formatLongDate, greeting } from '../lib/format'
import { fetchPatients } from '../store/patientsSlice'
import { btnOutline, btnPrimary, btnSoft, card, chipMono, display, skeleton } from '../ui'

function PatientCard({ patient }) {
  return (
    <article className={`${card} group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lg`}>
      <Link to={`/app/patients/${patient.public_id}`} className="flex items-center gap-3.5 p-4 sm:p-5">
        <Avatar name={patient.name} size={52} />
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-semibold">{patient.name}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className={chipMono}>{patient.public_id}</span>
            <span className="whitespace-nowrap">{patient.age_years.toFixed(1)} y · {patient.sex === 'M' ? 'Male' : 'Female'}</span>
          </p>
        </div>
      </Link>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line bg-paper/60 px-4 py-3 sm:px-5">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-2">
          <IconClipboard size={16} />{patient.assessment_count} {patient.assessment_count === 1 ? 'assessment' : 'assessments'}
        </span>
        <Link className={btnSoft} to={`/app/patients/${patient.public_id}/assess`}>Assess <IconArrowRight size={15} /></Link>
      </div>
    </article>
  )
}

export default function DashboardPage() {
  const dispatch = useDispatch()
  const user = useSelector((s) => s.auth.user)
  const { items, count, listStatus, listError } = useSelector((s) => s.patients)
  const [query, setQuery] = useState('')

  // Debounce: wait 250 ms after the last keystroke before calling the API.
  useEffect(() => {
    const timer = setTimeout(() => dispatch(fetchPatients(query.trim())), 250)
    return () => clearTimeout(timer)
  }, [query, dispatch])

  const totalAssessments = items.reduce((sum, p) => sum + p.assessment_count, 0)
  const loading = listStatus === 'loading' && items.length === 0

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-8">
      <div className="min-w-0 space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f2b33] via-[#123c45] to-brand p-6 text-white sm:p-8">
          <div aria-hidden="true" className="absolute -right-16 -top-16 size-64 rounded-full bg-saffron/20 blur-3xl" />
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-saffron">{formatLongDate()}</p>
          <h1 className={`${display} mt-2 text-3xl sm:text-4xl`}>{greeting()}, {user?.first_name || user?.username}</h1>
          <p className="mt-1 max-w-xl text-white/75">Here is an overview of your patients and recent assessments.</p>
          <dl className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
            {[['Patients', count], ['Assessments', totalAssessments], ['Newest', items[0]?.name?.split(' ')[0] ?? '—']].map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-2xl bg-white/10 px-3 py-3 ring-1 ring-white/15 sm:px-4">
                <dd className="truncate font-display text-2xl font-semibold sm:text-3xl">{value}</dd>
                <dt className="text-xs text-white/70">{label}</dt>
              </div>
            ))}
          </dl>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1 basis-64">
            <IconSearch size={19} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <label htmlFor="patient-search" className="sr-only">Search patients</label>
            <input id="patient-search" type="search" placeholder="Search by name or ID, for example ASD-000012"
              className="block min-h-12 w-full rounded-xl border border-line-2 bg-white pl-11 pr-3 text-base shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-saffron/40"
              value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Link to="/app/patients/new" className={btnPrimary}><IconPlus size={16} /> Add patient</Link>
        </div>

        {listError && <p role="alert" className="rounded-xl border border-rose/30 bg-rose/10 px-4 py-3 text-sm text-rose">{listError}</p>}

        {loading && (
          <div aria-busy="true" className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {[0, 1, 2].map((i) => <div key={i} className={`${skeleton} h-32`} />)}
          </div>
        )}

        {listStatus !== 'loading' && !listError && items.length === 0 && (
          <div className="grid justify-items-center gap-2 rounded-2xl border-2 border-dashed border-line-2 bg-white/60 px-6 py-12 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-brand-wash text-brand"><IconUsers size={26} /></span>
            <h2 className={`${display} text-2xl`}>{query ? 'No matching patients' : 'No patients yet'}</h2>
            <p className="text-muted">{query ? `Nothing matches “${query}”.` : 'Add your first patient to start an assessment.'}</p>
            {!query && <Link className={`${btnPrimary} mt-2`} to="/app/patients/new">Add the first patient</Link>}
          </div>
        )}

        {items.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {items.map((p) => <PatientCard key={p.public_id} patient={p} />)}
          </div>
        )}
      </div>

      <aside className="grid content-start gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <div className={`${card} p-5`}>
          <h2 className={`${display} text-xl`}>Quick start</h2>
          <ol className="mt-3 space-y-3 text-sm text-ink-2">
            {['Add a patient with their date of birth.', 'Open the patient and choose New assessment.', 'Enter the scores shown for their age band.', 'Review the probability, warnings and trend.'].map((t, i) => (
              <li key={t} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-wash text-xs font-bold text-brand">{i + 1}</span>{t}</li>
            ))}
          </ol>
        </div>
        <div className={`${card} p-5`}>
          <span className="grid size-10 place-items-center rounded-xl bg-saffron/25 text-[#a86a00]"><IconShield size={20} /></span>
          <h2 className={`${display} mt-3 text-xl`}>Read results carefully</h2>
          <p className="mt-1.5 text-sm text-ink-2">The model is a screening aid trained on school-age data. Results for very young children are flagged as extrapolation.</p>
          <Link to="/" className={`${btnOutline} mt-4 !w-full`}>About this tool</Link>
        </div>
      </aside>
    </div>
  )
}
