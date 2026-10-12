import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { BrandName, Signal } from '../components/Brand'
import { IconActivity, IconAlert, IconArrowRight, IconClipboard, IconLayers, IconShield, IconUsers } from '../components/Icons'
import SemiGauge from '../components/SemiGauge'
import { selectIsAuthenticated } from '../store/authSlice'
import { btnOutline, btnPrimary, card, container, display, eyebrow } from '../ui'

const FEATURES = [
  { Icon: IconLayers, title: 'Age-aware assessments', text: 'Only the tests that apply to each age band are asked, so every form is short and relevant.' },
  { Icon: IconActivity, title: 'Honest about uncertainty', text: 'A visible inconclusive zone means the model can say "not sure" instead of forcing a yes or no.' },
  { Icon: IconAlert, title: 'Safety warnings', text: 'Scores or ages outside what the model was trained on are flagged on every result.' },
  { Icon: IconShield, title: 'Private by design', text: 'Each record belongs to the doctor who created it. Other accounts cannot see it.' },
  { Icon: IconClipboard, title: 'Auditable history', text: 'Every result stores the exact inputs and model version, and cannot be edited afterwards.' },
  { Icon: IconUsers, title: 'Built for clinicians', text: 'Patient records, clinical history and a timeline of assessments in one place.' },
]
const STEPS = [
  ['Add a patient', 'Name, date of birth and sex. An ID is generated for you.'],
  ['Record the scores', 'ADOS, SRS, AQ and IQ results, shown only where they apply.'],
  ['Get a second opinion', 'The model returns a probability with its uncertainty and warnings.'],
  ['Review over time', 'Compare assessments on a timeline with a probability trend.'],
]
const HONEST = [
  'It is a screening aid for clinicians, not a diagnosis.',
  'The model was trained on research data from school-age participants and older.',
  'Predictions for children under about 5 are extrapolation and are flagged.',
  'It has not been clinically validated. Do not use it to make decisions on its own.',
]

export default function LandingPage() {
  const signedIn = useSelector(selectIsAuthenticated)
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur">
        <div className={`${container} flex h-16 items-center gap-4`}>
          <Link to="/" aria-label="Home"><BrandName /></Link>
          <nav aria-label="Sections" className="ml-6 hidden items-center gap-6 text-sm font-semibold text-ink-2 md:flex">
            <a href="#features" className="hover:text-brand">Features</a>
            <a href="#how" className="hover:text-brand">How it works</a>
            <a href="#safety" className="hover:text-brand">Safety</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {signedIn ? (
              <Link to="/app" className={btnPrimary}>Open dashboard <IconArrowRight size={16} /></Link>
            ) : (
              <>
                <Link to="/login" className={`${btnOutline} !px-3 sm:!px-4`}>Sign in</Link>
                <Link to="/register" className={`${btnPrimary} max-sm:hidden`}>Get started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className={`${container} grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24`}>
          <div className="animate-rise">
            <p className={eyebrow}>Clinical decision support</p>
            <h1 className={`${display} mt-3 text-4xl leading-[1.05] sm:text-5xl xl:text-6xl`}>A careful second opinion for every assessment.</h1>
            <p className="mt-5 max-w-xl text-lg text-ink-2">
              Record standardised scores, and get a machine-learning estimate that shows its uncertainty,
              warns when it is out of its depth, and keeps a complete audit trail.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={signedIn ? '/app' : '/register'} className={`${btnPrimary} !px-6 !py-3.5 !text-base`}>{signedIn ? 'Open dashboard' : 'Create a free account'} <IconArrowRight size={18} /></Link>
              <Link to="/login" className={`${btnOutline} !px-6 !py-3.5 !text-base`}>{signedIn ? 'Switch account' : 'Sign in'}</Link>
            </div>
            <p className="mt-4 text-sm text-muted">Demo login: <code className="rounded bg-paper-2 px-1.5 py-0.5">demo_doctor</code> / <code className="rounded bg-paper-2 px-1.5 py-0.5">DemoPass!234</code></p>
          </div>

          <div className="relative mx-auto w-full max-w-md animate-float">
            <div aria-hidden="true" className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-brand/20 via-saffron/20 to-high/15 blur-2xl" />
            <div className={`${card} p-6 sm:p-7`}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Sample result (illustrative)</p>
              <SemiGauge probability={0.43} className="mx-auto mt-3 max-w-[300px]" />
              <p className="mt-2 text-center font-display text-2xl font-semibold text-[#a86a00]">Inconclusive</p>
              <p className="mt-1 text-center text-sm text-muted">The model is not confident either way, so further assessment is advisable.</p>
              <Signal className="mx-auto mt-4 h-10 w-full max-w-[260px]" />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-20 border-y border-line bg-white/60 py-16 sm:py-20">
        <div className={container}>
          <p className={eyebrow}>Why it is different</p>
          <h2 className={`${display} mt-2 max-w-2xl text-3xl sm:text-4xl`}>Built to be useful, and honest about its limits.</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ Icon, title, text }) => (
              <article key={title} className={`${card} p-6 transition hover:-translate-y-1 hover:shadow-lg`}>
                <span className="grid size-11 place-items-center rounded-xl bg-brand-wash text-brand"><Icon size={22} /></span>
                <h3 className={`${display} mt-4 text-xl`}>{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="scroll-mt-20 py-16 sm:py-20">
        <div className={container}>
          <p className={eyebrow}>How it works</p>
          <h2 className={`${display} mt-2 text-3xl sm:text-4xl`}>From first record to second opinion in four steps.</h2>
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([title, text], i) => (
              <li key={title} className={`${card} relative p-6`}>
                <span className="font-display text-5xl font-semibold text-brand/20">{i + 1}</span>
                <h3 className="mt-2 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-ink-2">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="safety" className="scroll-mt-20 pb-16 sm:pb-20">
        <div className={container}>
          <div className="grid gap-8 rounded-3xl bg-gradient-to-br from-[#0f2b33] to-[#123c45] p-7 text-[#d4e5e8] sm:p-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-saffron">Safety first</p>
              <h2 className={`${display} mt-2 text-3xl text-white sm:text-4xl`}>What this tool is, and is not.</h2>
              <p className="mt-3 max-w-md">We would rather tell you the limits up front than have you discover them later.</p>
            </div>
            <ul className="grid gap-3">
              {HONEST.map((t) => (
                <li key={t} className="flex gap-3 rounded-xl bg-white/8 px-4 py-3 text-sm ring-1 ring-white/10">
                  <IconShield size={18} className="mt-0.5 shrink-0 text-saffron" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-white/60 py-8 text-sm text-muted">
        <div className={`${container} flex flex-wrap items-center justify-between gap-3`}>
          <BrandName className="!text-base" />
          <p>A screening aid for clinicians. Not a diagnosis.</p>
        </div>
      </footer>
    </div>
  )
}
