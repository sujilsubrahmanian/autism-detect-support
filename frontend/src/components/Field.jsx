import { useId } from 'react'
import { inputCls, inputErr } from '../ui'

/**
 * Label + input + hint + error, wired together for accessibility.
 * `as` renders <input>, <select> or <textarea>; `adornment` shows an extra element under the input.
 */
export default function Field({ label, hint, error, adornment, as: Tag = 'input', children, className = '', ...inputProps }) {
  const id = useId()
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined
  return (
    <div className={`grid min-w-0 content-start gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      <Tag id={id} className={error ? inputErr : inputCls} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...inputProps}>
        {children}
      </Tag>
      {adornment}
      {hint && <p id={`${id}-hint`} className="text-xs leading-snug text-muted">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="text-sm font-semibold text-rose">{error}</p>}
    </div>
  )
}
