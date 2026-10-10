import { useEffect, useState } from 'react'
import { formatPercent } from '../lib/assessment'

// Geometry of the half-circle (SVG user units).
const CX = 120
const CY = 112
const R = 86

/** Point on the arc for a probability p in [0,1]; 0 = far left, 1 = far right. */
function pointAt(p, radius = R) {
  const theta = Math.PI * (1 - p) // 180deg -> 0deg
  return [CX + radius * Math.cos(theta), CY - radius * Math.sin(theta)]
}

function arc(from, to) {
  const [x1, y1] = pointAt(from)
  const [x2, y2] = pointAt(to)
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

/**
 * The signature element of the app: a half-circle gauge split into three zones
 * (lower / inconclusive / higher). The needle sweeps to the model's probability.
 * Showing the inconclusive zone makes it obvious when the model is unsure.
 */
export default function SemiGauge({ probability, band = { lower: 0.4, upper: 0.6 } }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setShown(true), 120)
    return () => clearTimeout(timer)
  }, [])

  const gap = 0.006
  const label = `Estimated probability ${formatPercent(probability)}. Inconclusive zone is ${band.lower * 100}% to ${band.upper * 100}%.`
  const [lx, ly] = pointAt(band.lower, R + 17)
  const [ux, uy] = pointAt(band.upper, R + 17)

  return (
    <div className="gauge" role="img" aria-label={label}>
      <svg viewBox="0 0 240 168" aria-hidden="true" focusable="false">
        <path className="gauge__arc gauge__arc--low" d={arc(0, band.lower - gap)} />
        <path className="gauge__arc gauge__arc--mid" d={arc(band.lower + gap, band.upper - gap)} />
        <path className="gauge__arc gauge__arc--high" d={arc(band.upper + gap, 1)} />

        <text className="gauge__tick" x={lx} y={ly} textAnchor="middle">{band.lower * 100}</text>
        <text className="gauge__tick" x={ux} y={uy} textAnchor="middle">{band.upper * 100}</text>
        <text className="gauge__tick" x={CX - R} y={CY + 18} textAnchor="middle">0</text>
        <text className="gauge__tick" x={CX + R} y={CY + 18} textAnchor="middle">100</text>

        <g className="gauge__needle" style={{ transform: `rotate(${shown ? probability * 180 : 0}deg)`, transformOrigin: `${CX}px ${CY}px` }}>
          <line x1={CX} y1={CY} x2={CX - (R - 14)} y2={CY} />
        </g>
        <circle className="gauge__hub" cx={CX} cy={CY} r="8" />

        <text className="gauge__value" x={CX} y={CY + 52} textAnchor="middle">{formatPercent(probability)}</text>
      </svg>
      <p className="gauge__caption">estimated probability of the autism group</p>
    </div>
  )
}
