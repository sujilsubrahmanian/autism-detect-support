import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ResultCard from '../components/ResultCard'
import { assessment } from './fixtures'

describe('<ResultCard />', () => {
  it('labels class 1 as HIGHER likelihood of ASD (regression: original UI inverted this)', () => {
    render(<ResultCard assessment={assessment()} />)
    expect(screen.getByRole('heading', { name: 'Higher likelihood of ASD' })).toBeInTheDocument()
    expect(screen.queryByText(/not autistic/i)).not.toBeInTheDocument()
  })

  it('shows the probability on an accessible gauge', () => {
    render(<ResultCard assessment={assessment()} />)
    expect(screen.getByRole('img', { name: /93\.6%/ })).toBeInTheDocument()
    expect(screen.getByText('6.4%')).toBeInTheDocument() // control-group probability
  })

  it('shows lower-likelihood and inconclusive outcomes', () => {
    const { rerender } = render(<ResultCard assessment={assessment({ outcome: 'unlikely_asd', probability_autism: 0.1 })} />)
    expect(screen.getByRole('heading', { name: 'Lower likelihood of ASD' })).toBeInTheDocument()
    rerender(<ResultCard assessment={assessment({ outcome: 'inconclusive', probability_autism: 0.5 })} />)
    expect(screen.getByRole('heading', { name: 'Inconclusive' })).toBeInTheDocument()
  })

  it('renders warnings and the clinical disclaimer', () => {
    const warnings = [{ code: 'AGE_BELOW_TRAINING_RANGE', severity: 'high', message: 'Age 2.0 is below the training range.' }]
    render(<ResultCard assessment={assessment({ warnings })} />)
    expect(screen.getByText(/below the training range/)).toBeInTheDocument()
    expect(screen.getByText(/not a diagnosis/i)).toBeInTheDocument()
  })

  it('shows -9999 as "not collected" instead of a confusing number', () => {
    render(<ResultCard assessment={assessment()} />)
    expect(screen.getByText('not collected')).toBeInTheDocument()
    expect(screen.queryByText('-9999')).not.toBeInTheDocument()
  })
})
