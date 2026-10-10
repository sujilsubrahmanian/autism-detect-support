import { useId } from 'react'

/**
 * Label + input + hint + error, wired together for accessibility
 * (label <-> input via htmlFor/id, error announced via aria-describedby).
 * `as` lets the same component render <input>, <select> or <textarea>.
 * `adornment` is an optional extra element shown under the input (e.g. a range bar).
 */
export default function Field({ label, hint, error, adornment, as: Tag = 'input', children, ...inputProps }) {
  const id = useId()
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <Tag id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...inputProps}>
        {children}
      </Tag>
      {adornment}
      {hint && (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={`${id}-err`} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
