// All localStorage access goes through here and is wrapped in try/catch, because
// storage can be disabled (private mode) or full.
const KEY = 'asd.session'

export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? null
  } catch {
    return null
  }
}

export function saveSession(session) {
  try {
    if (session) localStorage.setItem(KEY, JSON.stringify(session))
    else localStorage.removeItem(KEY)
  } catch {
    /* ignore: user simply won't stay logged in across reloads */
  }
}
