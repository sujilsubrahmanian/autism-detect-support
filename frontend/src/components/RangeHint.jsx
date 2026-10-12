/**
 * Thin bar under a score input: the shaded band is the range the model saw in
 * training, the dot is the typed value (red when outside the band).
 */
export default function RangeHint({ min, max, range, value }) {
  const span = max - min || 1
  const pct = (n) => `${Math.min(100, Math.max(0, ((n - min) / span) * 100))}%`
  const typed = value !== '' && value !== undefined && !Number.isNaN(Number(value))
  const number = Number(value)
  const inside = typed && number >= range[0] && number <= range[1]
  return (
    <div aria-hidden="true" className="pt-0.5">
      <div className="relative h-1.5 rounded-full bg-paper-3">
        <span className="absolute inset-y-0 rounded-full bg-brand/45" style={{ left: pct(range[0]), width: `calc(${pct(range[1])} - ${pct(range[0])})` }} />
        {typed && number >= min && number <= max && (
          <span
            className={`absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] transition-[left] duration-200 ${inside ? 'border-ink bg-saffron' : 'border-white bg-rose ring-2 ring-rose'}`}
            style={{ left: pct(number) }}
          />
        )}
      </div>
      <div className="mt-1 flex justify-between text-[11px] tabular-nums text-muted">
        <span>{min}</span>
        <span>typical {range[0]}–{range[1]}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
