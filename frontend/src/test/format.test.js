import { describe, expect, it } from 'vitest'
import { avatarHue, greeting, initials } from '../lib/format'

describe('initials', () => {
  it.each([['Sujil Subrahmanian', 'SS'], ['aarav', 'A'], ['  meera   nair  das ', 'MN'], ['', '?']])(
    '%j -> %s', (name, expected) => expect(initials(name)).toBe(expected),
  )
})

describe('avatarHue', () => {
  it('is stable for the same name and within 0-359', () => {
    expect(avatarHue('Aarav Menon')).toBe(avatarHue('Aarav Menon'))
    expect(avatarHue('Aarav Menon')).toBeGreaterThanOrEqual(0)
    expect(avatarHue('Aarav Menon')).toBeLessThan(360)
  })
  it('usually differs between names', () => {
    expect(avatarHue('Aarav Menon')).not.toBe(avatarHue('Meera Nair'))
  })
})

describe('greeting', () => {
  it.each([[5, 'Good morning'], [11, 'Good morning'], [12, 'Good afternoon'], [16, 'Good afternoon'], [17, 'Good evening'], [23, 'Good evening']])(
    'at %s:00 -> %s', (hour, expected) => expect(greeting(new Date(2026, 9, 8, hour))).toBe(expected),
  )
})
