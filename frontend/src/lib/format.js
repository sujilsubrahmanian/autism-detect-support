// Small display helpers (pure functions, easy to test).

/** "Sujil Subrahmanian" -> "SS" */
export function initials(name = '') {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
  return letters || '?'
}

/** A stable colour (hue 0-359) per name, so each person keeps the same avatar colour. */
export function avatarHue(name = '') {
  return [...name].reduce((hue, char) => (hue * 31 + char.charCodeAt(0)) % 360, 7)
}

export function greeting(now = new Date()) {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export const formatLongDate = (date = new Date()) =>
  date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
