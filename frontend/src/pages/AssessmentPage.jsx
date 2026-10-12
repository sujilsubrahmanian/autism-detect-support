import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { fieldErrors } from '../api/client'
import AssessmentForm from '../components/AssessmentForm'
import Avatar from '../components/Avatar'
import { IconAlert } from '../components/Icons'
import ResultCard from '../components/ResultCard'
import { ageYears, defaultIqInstrument, groupShortLabel, pickAgeGroup } from '../lib/assessment'
import { fetchSchema, resetSubmission, submitAssessment } from '../store/assessmentsSlice'
import { fetchPatient } from '../store/patientsSlice'
import { btnOutline, btnPrimary, card, chipMono, display, eyebrow, skeleton } from '../ui'

export default function AssessmentPage() {
  const { publicId } = useParams()
  const dispatch = useDispatch()
  const patient = useSelector((s) => s.patients.current)
  const { schema, schemaStatus, submitStatus, submitError, lastResult } = useSelector((s) => s.assessments)

  useEffect(() => {
    dispatch(resetSubmission())
    dispatch(fetchPatient(publicId))
    dispatch(fetchSchema())
  }, [dispatch, publicId])

  if (schemaStatus === 'failed') return <p role="alert" className="rounded-xl border border-rose/30 bg-rose/10 px-4 py-3 text-rose">Could not load the assessment form.</p>
  if (!patient || patient.public_id !== publicId || !schema) return <div aria-busy="true" className={`${skeleton} h-40`} />

  const age = ageYears(patient.date_of_birth)
  const group = pickAgeGroup(schema, age)
  const crumbs = (last) => (
    <p className="mb-4 text-sm text-muted">
      <Link to="/app" className="hover:text-brand">Dashboard</Link> / <Link to={`/app/patients/${publicId}`} className="hover:text-brand">{patient.name}</Link> / {last}
    </p>
  )

  // After a successful run, show the result instead of the form.
  if (lastResult) {
    return (
      <>
        {crumbs('Result')}
        <p className={eyebrow}>Assessment complete</p>
        <h1 className={`${display} text-3xl sm:text-4xl`}>Result for {patient.name}</h1>
        <p className="mb-6 mt-1 text-muted">{patient.public_id} · saved to the patient&rsquo;s record</p>
        <div className="mx-auto max-w-4xl">
          <ResultCard assessment={lastResult} band={schema.inconclusive_band} />
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className={btnPrimary} to={`/app/patients/${publicId}`}>View patient record</Link>
            <button className={btnOutline} onClick={() => dispatch(resetSubmission())}>Run another</button>
          </div>
        </div>
      </>
    )
  }

  const errors = fieldErrors(submitError)
  const formError = submitError && Object.keys(errors).length === 0 ? (submitError.data?.detail ?? 'Something went wrong. Please try again.') : null

  return (
    <>
      {crumbs('New assessment')}
      <p className={eyebrow}>New assessment</p>
      <h1 className={`${display} text-3xl sm:text-4xl`}>{patient.name}</h1>
      <p className="mb-6 mt-1 text-muted">{patient.public_id} · age {age.toFixed(1)} · {group.label}</p>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <aside className={`${card} order-first grid gap-4 p-5 lg:sticky lg:top-24 lg:order-last`}>
          <div className="flex items-center gap-3">
            <Avatar name={patient.name} size={44} />
            <div className="min-w-0"><p className="truncate font-semibold">{patient.name}</p><span className={chipMono}>{patient.public_id}</span></div>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">Age band</p>
            <ol aria-label="Age band" className="flex flex-wrap gap-2">
              {schema.age_groups.map((g) => (
                <li key={g.key} aria-current={g.key === group.key ? 'step' : undefined}
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${g.key === group.key ? 'bg-brand text-white shadow-md shadow-brand/25' : 'border border-dashed border-line-2 text-muted'}`}>
                  {groupShortLabel(g.key)}
                </li>
              ))}
            </ol>
            <p className="mt-2 text-sm text-muted">Only the tests that apply to this age band are shown.</p>
          </div>
          <div className="rounded-xl bg-paper p-3 text-xs leading-relaxed text-ink-2">
            <p className="mb-1 font-bold text-ink">Reading the range bars</p>
            The shaded band is the range the model saw in training. A <span className="font-bold text-saffron">yellow dot</span> is inside it; a <span className="font-bold text-rose">red dot</span> is outside, so the result will carry a warning.
          </div>
          {age < schema.min_training_age && (
            <p role="note" className="flex gap-2 rounded-xl border border-[#efce8d] bg-[#fff5e0] p-3 text-sm text-[#6b4300]">
              <IconAlert size={18} className="mt-0.5 shrink-0" />
              <span>Younger than the youngest participants in the training data (about {schema.min_training_age} years). The prediction will be an extrapolation and is flagged.</span>
            </p>
          )}
        </aside>

        <div className="min-w-0">
          <AssessmentForm
            key={group.key}
            group={group}
            iqTypes={schema.iq_test_types}
            defaultIq={defaultIqInstrument(age)}
            submitting={submitStatus === 'loading'}
            errors={errors}
            formError={formError}
            onSubmit={(payload) => dispatch(submitAssessment({ publicId, payload }))}
          />
        </div>
      </div>
    </>
  )
}
