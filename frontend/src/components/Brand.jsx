import { IconActivity, IconLayers, IconShield } from './Icons'

export function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill="var(--brand)" />
      <path d="M6 21h5l3-9 4 13 3-9h5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Decorative animated "signal" line used on the sign-in screen. */
function Signal() {
  const d = 'M0 120 H70 L90 120 L110 60 L135 175 L160 90 L180 120 H300 L320 120 L342 40 L372 190 L400 105 L420 120 H600'
  return (
    <svg className="signal" viewBox="0 0 600 230" aria-hidden="true" focusable="false">
      <circle className="signal__ring" cx="300" cy="115" r="108" />
      <circle className="signal__ring signal__ring--2" cx="300" cy="115" r="72" />
      <path className="signal__glow" d={d} pathLength="1" />
      <path className="signal__line" d={d} pathLength="1" />
    </svg>
  )
}

const FEATURES = [
  { Icon: IconShield, title: 'Your patients only', text: 'Every record is private to the doctor who created it.' },
  { Icon: IconLayers, title: 'Age-aware assessments', text: 'Only the tests that apply to each age band are asked.' },
  { Icon: IconActivity, title: 'Honest about uncertainty', text: 'Shows an inconclusive zone and warns when the model is out of its depth.' },
]

export function HeroPanel() {
  return (
    <div className="hero">
      <div className="hero__brand">
        <Logo size={34} />
        <span>Autism Detection Support</span>
      </div>
      <div className="hero__body">
        <p className="hero__eyebrow">Clinical decision support</p>
        <h2 className="hero__title">A careful second opinion for every assessment.</h2>
        <Signal />
        <ul className="hero__features">
          {FEATURES.map(({ Icon, title, text }) => (
            <li key={title}>
              <span className="hero__icon"><Icon size={20} /></span>
              <span>
                <strong>{title}</strong>
                <small>{text}</small>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="hero__note">A screening aid for clinicians. It is not a diagnosis.</p>
    </div>
  )
}
