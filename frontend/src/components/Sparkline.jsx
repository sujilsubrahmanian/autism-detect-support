/** A tiny trend line for a series of probabilities (0..1), oldest first. */
export default function Sparkline({ values, width = 168, height = 52, className = '' }) {
  if (!values || values.length < 2) return null
  const pad = 6
  const step = (width - pad * 2) / (values.length - 1)
  const points = values.map((v, i) => [pad + i * step, height - pad - v * (height - pad * 2)])
  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${pad},${height - pad} ${line} ${width - pad},${height - pad}`
  const [lastX, lastY] = points[points.length - 1]
  return (
    <svg className={`h-auto w-full ${className}`} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Probability trend over ${values.length} assessments`}>
      <polygon className="fill-brand/15" points={area} />
      <polyline className="fill-none stroke-brand stroke-[2.4]" strokeLinejoin="round" strokeLinecap="round" points={line} />
      <circle className="fill-saffron stroke-ink stroke-2" cx={lastX} cy={lastY} r="3.6" />
    </svg>
  )
}
