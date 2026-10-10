import { useState } from 'react'
import { IQ_FIELDS, groupFields } from '../lib/assessment'
import Field from './Field'
import RangeHint from './RangeHint'

/**
 * Builds its inputs from the backend schema for ONE age group, so the list of tests
 * is never duplicated in the frontend. Tests are grouped into readable sections.
 *
 * Props
 *   group        age-group object from GET /ml/schema/
 *   iqTypes      [{value,label}] instruments (WASI / WAIS / WISC / ...)
 *   defaultIq    preselected instrument
 *   onSubmit     (payload) => void
 *   submitting   disables the button while the request is in flight
 *   errors       { fieldName: "message" } from the server
 *   formError    non-field error text
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
    <form className="assess" onSubmit={handleSubmit} aria-label={`Assessment for ${group.label}`}>
      {sections.map((section) => (
        <fieldset key={section.id} className="card section">
          <legend className="section__title">{section.title}</legend>
          <p className="section__hint">{section.hint}</p>

          {section.id === 'cognitive' && hasIq && (
            <Field
              as="select"
              label="IQ instrument used"
              hint="WISC is typically used for children, WAIS for adults, WASI is the abbreviated scale."
              value={iqTest}
              onChange={(e) => setIqTest(e.target.value)}
              error={errors.iq_test_type}
            >
              {iqTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Field>
          )}

          <div className="form__grid">
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

      <div className="card section">
        <Field
          as="textarea"
          label="Clinical notes (optional)"
          rows={3}
          maxLength={2000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          error={errors.notes}
        />
      </div>

      {formError && (
        <p className="banner banner--error" role="alert">
          {formError}
        </p>
      )}
      <button className="btn btn--primary btn--large" type="submit" disabled={submitting}>
        {submitting && <span className="spinner" aria-hidden="true" />}
        {submitting ? 'Running model…' : 'Run assessment'}
      </button>
    </form>
  )
}
