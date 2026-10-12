import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import HistoryForm from '../components/HistoryForm'
import { IconArrowRight } from '../components/Icons'
import ResultCard from '../components/ResultCard'
import SemiGauge from '../components/SemiGauge'
import Sparkline from '../components/Sparkline'
import { OUTCOME_COPY, formatDate, formatPercent, groupShortLabel } from '../lib/assessment'
import { fetchAssessments, fetchSchema } from '../store/assessmentsSlice'
import { fetchPatient } from '../store/patientsSlice'
import { TONE, btnOutline, btnPrimary, card, chip, chipMono, display, skeleton } from '../ui'

export default function PatientDetailPage() {
  const { publicId } = useParams()
  const dispatch = useDispatch()
  const { current: patient, currentStatus, currentError } = useSelector((s) => s.patients)
  const { history, historyStatus, schema } = useSelector((s) => s.assessments)
  const [tab, setTab] = useState('assessments')

  useEffect(() => {
    dispatch(fetchPatient(publicId))
    dispatch(fetchAssessments(publicId))
    dispatch(fetchSchema())
  }, [dispatch, publicId])

  if (currentStatus === 'failed') {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p role="alert" className="mb-4 rounded-xl border border-rose/30 bg-rose/10 px-4 py-3 text-rose">{currentError}</p>
        <Link className={btnOutline} to="/app">Back to the dashboard</Link>
      </div>
    )
  }
  if (!patient || patient.public_id !== publicId) return <div aria-busy="true" className={`${skeleton} h-40`} />

  const latest = history[0]
  const trend = [...history].reverse().map((a) => a.prediction.probability_autism)

  return (
    <>
      <p className="mb-4 text-sm text-muted"><Link to="/app" className="hover:text-brand">Dashboard</Link> / {patient.name}</p>

      <section className={`${card} mb-6 flex flex-wrap items-center gap-4 p-5 sm:p-6`}>
        <Avatar name={patient.name} size={68} />
        <div className="min-w-0 flex-1 basis-60">
          <h1 className={`${display} truncate text-3xl sm:text-4xl`}>{patient.name}</h1>
          <p className="mt-2 flex flex-wrap gap-2">
            <span className={chipMono}>{patient.public_id}</span>
            <span className={chip}>{patient.age_years.toFixed(1)} years</span>
            <span className={chip}>{patient.sex === 'M' ? 'Male' : 'Female'}</span>
            {patient.guardian_name && <span className={chip}>Guardian: {patient.guardian_name}</span>}
          </p>
        </div>
        <Link className={`${btnPrimary} w-full sm:w-auto`} to={`/app/patients/${publicId}/assess`}>New assessment <IconArrowRight size={16} /></Link>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <aside aria-label="Patient summary" className={`${card} order-first grid gap-4 p-5 lg:sticky lg:top-24 lg:order-last`}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Latest result</p>
          {latest ? (
            <>
              <SemiGauge probability={latest.prediction.probability_autism} band={schema?.inconclusive_band} className="mx-auto w-full max-w-[260px]" />
              <p className="text-center">
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${TONE[OUTCOME_COPY[latest.prediction.outcome].tone].chip}`}>
                  {OUTCOME_COPY[latest.prediction.outcome].label}
                </span>
              </p>
            </>
          ) : <p className="text-sm text-muted">No assessments yet.</p>}
          <div className="grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
            <div><p className="text-[11px] font-bold uppercase tracking-wider text-muted">Assessments</p><p className={`${display} text-2xl`}>{history.length}</p></div>
            <div><p className="text-[11px] font-bold uppercase tracking-wider text-muted">Trend</p>{trend.length >= 2 ? <Sparkline values={trend} /> : <p className="text-xs text-muted">Needs two assessments</p>}</div>
          </div>
        </aside>

        <div className="min-w-0">
          <div role="tablist" className="mb-5 flex gap-1 border-b border-line-2">
            {[['assessments', 'Assessments'], ['history', 'Clinical history']].map(([key, label]) => (
              <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
                className={`-mb-px border-b-[3px] px-4 py-2.5 text-sm font-semibold transition ${tab === key ? 'border-brand text-brand-deep' : 'border-transparent text-muted hover:text-ink'}`}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'history' && <HistoryForm publicId={publicId} />}

          {tab === 'assessments' && (
            <>
              {historyStatus === 'loading' && history.length === 0 && <div aria-busy="true" className={`${skeleton} h-16`} />}
              {historyStatus !== 'loading' && history.length === 0 && (
                <div className="grid justify-items-center gap-2 rounded-2xl border-2 border-dashed border-line-2 bg-white/60 px-6 py-10 text-center">
                  <h2 className={`${display} text-2xl`}>No assessments yet</h2>
                  <p className="text-muted">Start one to get the model&rsquo;s second opinion.</p>
                  <Link className={`${btnPrimary} mt-2`} to={`/app/patients/${publicId}/assess`}>Start an assessment</Link>
                </div>
              )}
              <ul className="grid gap-3">
                {history.map((a) => {
                  const copy = OUTCOME_COPY[a.prediction.outcome]
                  return (
                    <li key={a.id} className={`${card} overflow-hidden border-l-[5px] ${TONE[copy.tone].edge}`}>
                      <details className="group">
                        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 hover:bg-paper/60 sm:px-5 [&::-webkit-details-marker]:hidden">
                          <span className="font-semibold">{formatDate(a.assessed_on)}</span>
                          <span className="hidden text-sm text-muted sm:inline">{groupShortLabel(a.age_group)}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${TONE[copy.tone].chip}`}>{copy.label}</span>
                          <span className={`${display} ml-auto text-lg tabular-nums`}>{formatPercent(a.prediction.probability_autism)}</span>
                        </summary>
                        <div className="border-t border-line p-3 sm:p-4">
                          <ResultCard assessment={a} band={schema?.inconclusive_band} />
                        </div>
                      </details>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  )
}
