import { describe, expect, it } from 'vitest'
import { ageYears, defaultIqInstrument, groupFields, pickAgeGroup } from '../lib/assessment'
import { schema } from './fixtures'

describe('pickAgeGroup', () => {
  it.each([[0, '0-3'], [2.99, '0-3'], [6, '6-12'], [12.99, '6-12'], [13, '13+'], [40, '13+']])(
    'age %s -> %s (half-open bands)', (age, key) => expect(pickAgeGroup(schema, age).key).toBe(key),
  )
  it('returns undefined in a gap rather than guessing', () => {
    expect(pickAgeGroup(schema, 4)).toBeUndefined() // fixture has no 3-5 band
  })
})

describe('ageYears', () => {
  it('computes decimal years', () => {
    expect(ageYears('2016-01-01', new Date('2026-01-01'))).toBeCloseTo(10, 1)
  })
})

describe('defaultIqInstrument', () => {
  it.each([[4, 'OTHER'], [9, 'WISC'], [15.9, 'WISC'], [16, 'WAIS'], [30, 'WAIS']])('%s -> %s', (age, expected) =>
    expect(defaultIqInstrument(age)).toBe(expected))
})

describe('groupFields', () => {
  const keys = (sections) => sections.map((s) => s.id)

  it('splits school-age tests into three readable sections', () => {
    const fields = ['fiq', 'viq', 'piq', 'ados_total', 'ados_comm', 'srs_raw_total', 'aq_total'].map((key) => ({ key }))
    const sections = groupFields(fields)
    expect(keys(sections)).toEqual(['cognitive', 'ados', 'questionnaire'])
    expect(sections[0].fields).toHaveLength(3)
    expect(sections[2].fields.map((f) => f.key)).toEqual(['srs_raw_total', 'aq_total'])
  })

  it('omits sections with no fields (toddlers have no IQ tests)', () => {
    const fields = ['ados_total', 'ados_comm', 'srs_raw_total'].map((key) => ({ key }))
    expect(keys(groupFields(fields))).toEqual(['ados', 'questionnaire'])
  })
})
