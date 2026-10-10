import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AssessmentForm from '../components/AssessmentForm'
import { schema } from './fixtures'

const [toddler, school] = schema.age_groups
const base = { iqTypes: schema.iq_test_types, defaultIq: 'WISC', onSubmit: () => {} }

describe('<AssessmentForm />', () => {
  it('renders only the tests of the age group (no IQ fields or IQ instrument for toddlers)', () => {
    render(<AssessmentForm {...base} group={toddler} />)
    expect(screen.getByLabelText('ADOS total')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Full-scale IQ/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText('IQ instrument used')).not.toBeInTheDocument()
  })

  it('renders IQ fields and instrument selector for school-age children', () => {
    render(<AssessmentForm {...base} group={school} />)
    expect(screen.getByLabelText(/Full-scale IQ/)).toBeInTheDocument()
    expect(screen.getByLabelText('IQ instrument used')).toHaveValue('WISC')
  })

  it('never offers the diagnosis (DX_GROUP) as an input - that is the label being predicted', () => {
    render(<AssessmentForm {...base} group={school} />)
    expect(screen.queryByLabelText(/dx_group|diagnosis/i)).not.toBeInTheDocument()
  })

  it('submits numbers (not strings) plus the instrument', async () => {
    const onSubmit = vi.fn()
    render(<AssessmentForm {...base} group={school} onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/Full-scale IQ/), '98')
    await userEvent.type(screen.getByLabelText('ADOS total'), '12')
    await userEvent.click(screen.getByRole('button', { name: 'Run assessment' }))
    expect(onSubmit).toHaveBeenCalledWith({ fiq: 98, ados_total: 12, iq_test_type: 'WISC' })
  })

  it('shows server-side validation errors under the matching field', () => {
    render(<AssessmentForm {...base} group={school} errors={{ fiq: 'Full-scale IQ must be at most 180.' }} />)
    expect(screen.getByRole('alert')).toHaveTextContent('at most 180')
    expect(screen.getByLabelText(/Full-scale IQ/)).toHaveAttribute('aria-invalid', 'true')
  })

  it('disables the button while submitting', () => {
    render(<AssessmentForm {...base} group={school} submitting />)
    expect(screen.getByRole('button', { name: /running model/i })).toBeDisabled()
  })
})
