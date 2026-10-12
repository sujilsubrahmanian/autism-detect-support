export function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false" className="shrink-0">
      <rect width="32" height="32" rx="9" fill="#0e6b73" />
      <path d="M6 21h5l3-9 4 13 3-9h5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function BrandName({ className = '' }) {
  return (
    <span className={`flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight ${className}`}>
      <Logo size={32} />
      <span className="hidden leading-tight sm:block">Autism Detection<br />Support</span>
    </span>
  )
}

/** Decorative signal line that draws itself. */
export function Signal({ className = '' }) {
  const d = 'M0 120 H70 L90 120 L110 60 L135 175 L160 90 L180 120 H300 L320 120 L342 40 L372 190 L400 105 L420 120 H600'
  const draw = 'fill-none stroke-saffron [stroke-dasharray:1] [stroke-dashoffset:1] animate-draw [stroke-linecap:round] [stroke-linejoin:round]'
  return (
    <svg className={className} viewBox="0 0 600 230" aria-hidden="true" focusable="false">
      <path d={d} pathLength="1" className={`${draw} stroke-[9] opacity-25 blur-[5px]`} />
      <path d={d} pathLength="1" className={`${draw} stroke-[3]`} />
    </svg>
  )
}
