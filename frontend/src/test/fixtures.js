export const schema = {
  min_training_age: 5,
  inconclusive_band: { lower: 0.4, upper: 0.6 },
  iq_test_types: [
    { value: 'WASI', label: 'WASI' },
    { value: 'WISC', label: 'WISC' },
    { value: 'WAIS', label: 'WAIS' },
  ],
  age_groups: [
    {
      key: '0-3', label: 'Infant / toddler (0-3 years)', min_age: 0, max_age: 3,
      fields: [
        { key: 'ados_total', label: 'ADOS total', min: 0, max: 30, help_text: 'h', training_range: [0, 24] },
        { key: 'srs_raw_total', label: 'SRS raw total', min: 0, max: 195, help_text: 'h', training_range: [29, 186] },
      ],
    },
    {
      key: '6-12', label: 'School age (6-12 years)', min_age: 6, max_age: 13,
      fields: [
        { key: 'fiq', label: 'Full-scale IQ (FIQ)', min: 30, max: 180, help_text: 'h', training_range: [51, 140] },
        { key: 'ados_total', label: 'ADOS total', min: 0, max: 30, help_text: 'h', training_range: [0, 24] },
      ],
    },
    { key: '13+', label: 'Adolescent / adult (13+ years)', min_age: 13, max_age: null, fields: [] },
  ],
}

export const assessment = (over = {}) => ({
  id: 1,
  prediction: {
    outcome: 'likely_asd',
    predicted_code: 1,
    probability_autism: 0.936,
    probability_control: 0.064,
    model_version: 'voting-rf-gb@26a4ede8',
    warnings: [],
    features: { AGE_AT_SCAN: 9, FIQ: -9999, ADOS_TOTAL: 12 },
    ...over,
  },
})
