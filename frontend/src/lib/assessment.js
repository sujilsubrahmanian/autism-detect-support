// Pure helpers (no React, no network) so they are trivial to unit test.

/** Age in decimal years on a given date; mirrors the backend's Patient.age_on(). */
export function ageYears(dateOfBirth, on = new Date()) {
  const dob = new Date(dateOfBirth)
  const days = (on.getTime() - dob.getTime()) / 86_400_000
  return Math.round((days / 365.25) * 100) / 100
}

/** Find the age band for an age. Bands are half-open: [min, max). */
export function pickAgeGroup(schema, age) {
  return schema.age_groups.find((g) => age >= g.min_age && (g.max_age == null || age < g.max_age))
}

/** Which IQ instrument is the sensible default? (WISC: children 6-16, WAIS: 16+). */
export function defaultIqInstrument(age) {
  if (age < 6) return 'OTHER'
  return age < 16 ? 'WISC' : 'WAIS'
}

export const IQ_FIELDS = ['fiq', 'viq', 'piq']

export const OUTCOME_COPY = {
  likely_asd: {
    label: 'Higher likelihood of ASD',
    tone: 'high',
    summary: 'The model sees a higher likelihood that this profile resembles the autism group it was trained on.',
  },
  unlikely_asd: {
    label: 'Lower likelihood of ASD',
    tone: 'low',
    summary: 'The model sees a lower likelihood that this profile resembles the autism group it was trained on.',
  },
  inconclusive: {
    label: 'Inconclusive',
    tone: 'mid',
    summary: 'The model is not confident either way, so further assessment is advisable.',
  },
}

// The form groups the nine tests into three readable sections.
export const SECTION_ORDER = ['cognitive', 'ados', 'questionnaire']
export const SECTION_LABELS = {
  cognitive: { title: 'Cognitive ability', hint: 'Wechsler IQ scores' },
  ados: { title: 'ADOS observation', hint: 'Autism Diagnostic Observation Schedule' },
  questionnaire: { title: 'Questionnaires', hint: 'Parent or self-report scales' },
}

export function fieldSection(key) {
  if (IQ_FIELDS.includes(key)) return 'cognitive'
  if (key.startsWith('ados_')) return 'ados'
  return 'questionnaire'
}

/** [{id, title, hint, fields:[...]}] - only sections that have at least one field. */
export function groupFields(fields) {
  return SECTION_ORDER.map((id) => ({
    id,
    ...SECTION_LABELS[id],
    fields: fields.filter((f) => fieldSection(f.key) === id),
  })).filter((section) => section.fields.length > 0)
}

export const formatPercent = (p) => `${(p * 100).toFixed(1)}%`

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

export const groupShortLabel = (key) => (key.endsWith('+') ? `Age ${key.slice(0, -1)}+` : `Age ${key}`)
