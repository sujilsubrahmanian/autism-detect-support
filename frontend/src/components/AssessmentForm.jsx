import { useState } from 'react'
import { IQ_FIELDS, groupFields } from '../lib/assessment'
import { btnLg, btnPrimary, card } from '../ui'
import Field from './Field'
import RangeHint from './RangeHint'

/**
 * Builds its inputs from the backend schema for ONE age group, so the list of tests
 * is never duplicated in the frontend. Tests are grouped into readable sections.
 */
export default function AssessmentForm({ group, iqTypes, defaultIq, onSubmit, submitting, errors = {}, formError }) {
  const [values, setValues] = useState({})
  const [iqTest, setIqTest] = useState(defaultIq)
  const [notes, setNotes] = useState('')

  const sections = groupFields(group.fields)
  const hasIq = group.fields.some((f) => IQ_FIELDS.includes(f.key))

  const handleSubmit = (event) => {
    event.preventDefault()
    const payload = {}
    for (const field of group.fields) payload[field.key] = Number(values[field.key])
    if (hasIq && iqTest) payload.iq_test_type = iqTest
    if (notes.trim()) payload.notes = notes.trim()
    onSubmit(payload)
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} aria-label={`Assessment for ${group.label}`}>
      {sections.map((section) => (
        <fieldset key={section.id} className={`${card} min-w-0 p-5 sm:p-6`}>
          <legend className="float-left w-full font-display text-xl font-semibold">{section.title}</legend>
          <p className="clear-both mb-4 text-sm text-muted">{section.hint}</p>

          {section.id === 'cognitive' && hasIq && (
            <Field
              as="select"
              className="mb-4"
              label="IQ instrument used"
              hint="WISC is typically used for children, WAIS for adults, WASI is the abbreviated scale."
              value={iqTest}
              onChange={(e) => setIqTest(e.target.value)}
              error={errors.iq_test_type}
            >
              {iqTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Field>
          )}

          <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2 2xl:grid-cols-3">
            {section.fields.map((f) => (
              <Field
                key={f.key}
                label={f.label}
                hint={`${f.help_text} Allowed ${f.min}–${f.max}.`}
                error={errors[f.key]}
                adornment={<RangeHint min={f.min} max={f.max} range={f.training_range} value={values[f.key]} />}
                type="number"
                inputMode="numeric"
                min={f.min}
                max={f.max}
                step="1"
                required
                value={values[f.key] ?? ''}
                onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
              />
            ))}
          </div>
        </fieldset>
      ))}

      <div className={`${card} p-5 sm:p-6`}>
        <Field as="textarea" label="Clinical notes (optional)" rows={3} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} error={errors.notes} />
      </div>

      {formError && <p role="alert" className="rounded-xl border border-rose/30 bg-rose/10 px-4 py-3 text-sm text-rose">{formError}</p>}
      <button className={`${btnPrimary} ${btnLg}`} type="submit" disabled={submitting}>
        {submitting && <span aria-hidden="true" className="size-4 animate-spin rounded-full border-[2.5px] border-white/40 border-t-white" />}
        {submitting ? 'Running model…' : 'Run assessment'}
      </button>
    </form>
  )
}
