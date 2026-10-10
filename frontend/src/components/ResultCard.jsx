import { OUTCOME_COPY, formatPercent } from '../lib/assessment'
import { IconAlert, IconInfo } from './Icons'
import SemiGauge from './SemiGauge'

const MISSING = -9999

export default function ResultCard({ assessment, band }) {
  const { prediction } = assessment
  const copy = OUTCOME_COPY[prediction.outcome]

  return (
    <section className={`result result--${copy.tone}`} aria-label="Prediction result">
      <div className="result__top">
        <div className="result__text">
          <span className={`pill pill--${copy.tone}`}>Model second opinion</span>
          <h2 className="result__outcome">{copy.label}</h2>
          <p className="result__summary">{copy.summary}</p>
          <dl className="result__facts">
            <div>
              <dt>Control group</dt>
              <dd>{formatPercent(prediction.probability_control)}</dd>
            </div>
            <div>
              <dt>Model</dt>
              <dd>{prediction.model_version}</dd>
            </div>
          </dl>
        </div>
        <SemiGauge probability={prediction.probability_autism} band={band} />
      </div>

      {prediction.warnings.length > 0 && (
        <ul className="warnings" aria-label="Warnings">
          {prediction.warnings.map((w, i) => (
            <li key={`${w.code}-${i}`} className={`warnings__item warnings__item--${w.severity}`}>
              <IconAlert size={18} />
              <span>{w.message}</span>
            </li>
          ))}
        </ul>
      )}

      <details className="result__inputs">
        <summary>Inputs sent to the model</summary>
        <dl>
          {Object.entries(prediction.features).map(([name, value]) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{value === MISSING ? 'not collected' : value}</dd>
            </div>
          ))}
        </dl>
      </details>

      <p className="disclaimer">
        <IconInfo size={16} />
        <span>
          A screening aid trained on research data. It is not a diagnosis and should be read alongside
          clinical judgement.
        </span>
      </p>
    </section>
  )
}
