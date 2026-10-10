import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import ProtectedRoute from '../components/ProtectedRoute'
import { createStore } from '../store'

function renderAt(preloadedAuth) {
  const store = createStore({ auth: { user: null, access: null, refresh: null, status: 'idle', error: null, ...preloadedAuth } })
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/secret']}>
        <Routes>
          <Route path="/login" element={<p>Login screen</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/secret" element={<p>Secret data</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('<ProtectedRoute />', () => {
  it('redirects anonymous visitors to /login', () => {
    renderAt({})
    expect(screen.getByText('Login screen')).toBeInTheDocument()
    expect(screen.queryByText('Secret data')).not.toBeInTheDocument()
  })
  it('lets authenticated doctors through', () => {
    renderAt({ access: 'token' })
    expect(screen.getByText('Secret data')).toBeInTheDocument()
  })
})
