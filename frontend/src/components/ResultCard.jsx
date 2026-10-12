import { OUTCOME_COPY, formatPercent } from '../lib/assessment'
import { TONE, card } from '../ui'
import { IconAlert, IconInfo } from './Icons'
import SemiGauge from './SemiGauge'

const MISSING = -9999

export default function ResultCard({ assessment, band }) {
  const { prediction } = assessment
  const copy = OUTCOME_COPY[prediction.outcome]
  const tone = TONE[copy.tone]

  return (
    <section aria-label="Prediction result" className={`${card} relative overflow-hidden p-5 sm:p-7`}>
      <span className={`absolute inset-x-0 top-0 h-1.5 ${tone.top}`} />
      <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(220px,300px)]">
        <div>
          <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${tone.soft}`}>Model second opinion</span>
          <h2 className={`mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl ${tone.text}`}>{copy.label}</h2>
          <p className="mt-2 max-w-prose text-ink-2">{copy.summary}</p>
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-muted">Control group</dt>
              <dd className="font-semibold tabular-nums">{formatPercent(prediction.probability_control)}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-muted">Model</dt>
              <dd className="break-all font-semibold">{prediction.model_version}</dd>
            </div>
          </dl>
        </div>
        <SemiGauge probability={prediction.probability_autism} band={band} className="mx-auto w-full max-w-[300px]" />
      </div>

      {prediction.warnings.length > 0 && (
        <ul aria-label="Warnings" className="mt-6 grid gap-2">
          {prediction.warnings.map((w, i) => (
            <li
              key={`${w.code}-${i}`}
              className={`flex gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${w.severity === 'high' ? 'border-[#e5a45a] bg-[#ffeacb] font-semibold text-[#6b4300]' : 'border-[#efce8d] bg-[#fff5e0] text-[#6b4300]'}`}
            >
              <IconAlert size={18} className="mt-0.5 shrink-0" />
              <span>{w.message}</span>
            </li>
          ))}
        </ul>
      )}

      <details className="mt-5">
        <summary className="cursor-pointer text-sm font-semibold text-brand-deep">Inputs sent to the model</summary>
        <dl className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
          {Object.entries(prediction.features).map(([name, value]) => (
            <div key={name} className="flex justify-between gap-3 border-b border-dotted border-line-2 pb-1 text-sm">
              <dt className="text-muted">{name}</dt>
              <dd className="font-semibold tabular-nums">{value === MISSING ? 'not collected' : value}</dd>
            </div>
          ))}
        </dl>
      </details>

      <p className="mt-5 flex gap-2 border-t border-line pt-4 text-xs text-muted">
        <IconInfo size={16} className="mt-0.5 shrink-0" />
        <span>
          A screening aid trained on research data. It is not a diagnosis and should be read alongside
          clinical judgement.
        </span>
      </p>
    </section>
  )
}
