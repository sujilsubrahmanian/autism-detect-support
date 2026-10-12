import { useEffect, useState } from 'react'
import { formatPercent } from '../lib/assessment'

const CX = 120
const CY = 112
const R = 86

/** Point on the arc for a probability p in [0,1]; 0 = far left, 1 = far right. */
function pointAt(p, radius = R) {
  const theta = Math.PI * (1 - p)
  return [CX + radius * Math.cos(theta), CY - radius * Math.sin(theta)]
}

function arc(from, to) {
  const [x1, y1] = pointAt(from)
  const [x2, y2] = pointAt(to)
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

/** Half-circle gauge in three zones (lower / inconclusive / higher); the needle sweeps to the probability. */
export default function SemiGauge({ probability, band = { lower: 0.4, upper: 0.6 }, className = '' }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setShown(true), 120)
    return () => clearTimeout(timer)
  }, [])

  const gap = 0.006
  const label = `Estimated probability ${formatPercent(probability)}. Inconclusive zone is ${band.lower * 100}% to ${band.upper * 100}%.`
  const [lx, ly] = pointAt(band.lower, R + 17)
  const [ux, uy] = pointAt(band.upper, R + 17)
  const arcCls = 'fill-none stroke-[15]'
  const tick = 'fill-muted text-[9px] font-semibold'

  return (
    <div className={`text-center ${className}`} role="img" aria-label={label}>
      <svg viewBox="0 0 240 178" aria-hidden="true" focusable="false" className="h-auto w-full overflow-visible">
        <path className={`${arcCls} stroke-low`} d={arc(0, band.lower - gap)} />
        <path className={`${arcCls} stroke-mid`} d={arc(band.lower + gap, band.upper - gap)} />
        <path className={`${arcCls} stroke-high`} d={arc(band.upper + gap, 1)} />
        <text className={tick} x={lx} y={ly} textAnchor="middle">{band.lower * 100}</text>
        <text className={tick} x={ux} y={uy} textAnchor="middle">{band.upper * 100}</text>
        <text className={tick} x={CX - R} y={CY + 18} textAnchor="middle">0</text>
        <text className={tick} x={CX + R} y={CY + 18} textAnchor="middle">100</text>
        <g
          className="transition-transform duration-[1200ms] ease-[cubic-bezier(0.2,0.9,0.25,1.12)]"
          style={{ transform: `rotate(${shown ? probability * 180 : 0}deg)`, transformOrigin: `${CX}px ${CY}px` }}
        >
          <line x1={CX} y1={CY} x2={CX - (R - 14)} y2={CY} className="stroke-ink stroke-[3.6]" strokeLinecap="round" />
        </g>
        <circle cx={CX} cy={CY} r="8" className="fill-ink stroke-white stroke-[3]" />
        <text x={CX} y={CY + 52} textAnchor="middle" className="fill-ink font-display text-[32px] font-semibold tabular-nums">{formatPercent(probability)}</text>
      </svg>
      <p className="mt-0.5 text-xs text-muted">estimated probability of the autism group</p>
    </div>
  )
}
