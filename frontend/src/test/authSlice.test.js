import { describe, expect, it } from 'vitest'
import reducer, { login, logout, selectIsAuthenticated } from '../store/authSlice'

const empty = { user: null, access: null, refresh: null, status: 'idle', error: null }

describe('authSlice', () => {
  it('stores tokens and user when login succeeds, and persists them', () => {
    const payload = { access: 'a', refresh: 'r', user: { username: 'dr' } }
    const state = reducer(empty, login.fulfilled(payload, 'req', {}))
    expect(state.user.username).toBe('dr')
    expect(selectIsAuthenticated({ auth: state })).toBe(true)
    expect(JSON.parse(localStorage.getItem('asd.session')).access).toBe('a')
  })

  it('records the error when login fails', () => {
    const state = reducer(empty, login.rejected(null, 'req', {}, 'Invalid credentials'))
    expect(state.error).toBe('Invalid credentials')
    expect(state.status).toBe('failed')
  })

  it('logout clears state and storage', () => {
    const loggedIn = { ...empty, access: 'a', refresh: 'r', user: { username: 'dr' } }
    localStorage.setItem('asd.session', '{}')
    const state = reducer(loggedIn, logout())
    expect(state).toEqual(empty)
    expect(localStorage.getItem('asd.session')).toBeNull()
  })
})
