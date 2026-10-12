import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import LandingPage from '../pages/LandingPage'
import { createStore } from '../store'

const empty = { user: null, access: null, refresh: null, status: 'idle', error: null }

function renderLanding(auth = {}) {
  const store = createStore({ auth: { ...empty, ...auth } })
  return render(<Provider store={store}><MemoryRouter><LandingPage /></MemoryRouter></Provider>)
}

describe('<LandingPage />', () => {
  it('invites visitors to sign in or register', () => {
    renderLanding()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/second opinion/i)
    expect(screen.getAllByRole('link', { name: 'Sign in' })[0]).toHaveAttribute('href', '/login')
    expect(screen.getAllByRole('link', { name: /get started|create a free account/i }).length).toBeGreaterThan(0)
  })

  it('offers the dashboard to signed-in doctors', () => {
    renderLanding({ access: 'token' })
    expect(screen.getAllByRole('link', { name: /open dashboard/i })[0]).toHaveAttribute('href', '/app')
    expect(screen.queryAllByRole('link', { name: 'Sign in' })).toHaveLength(0)
  })

  it('states the limitations honestly', () => {
    renderLanding()
    expect(screen.getByText(/not a diagnosis/i, { selector: 'li span' })).toBeInTheDocument()
  })
})
