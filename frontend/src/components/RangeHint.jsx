/**
 * A thin bar under a score input:
 *   - the shaded band is the range the model saw in training,
 *   - the dot is the value being typed.
 * Purely visual (aria-hidden); the numbers are also written in the field hint.
 */
export default function RangeHint({ min, max, range, value }) {
  const span = max - min || 1
  const pct = (n) => `${Math.min(100, Math.max(0, ((n - min) / span) * 100))}%`
  const typed = value !== '' && value !== undefined && !Number.isNaN(Number(value))
  const number = Number(value)
  const inside = typed && number >= range[0] && number <= range[1]
  return (
    <div className="rangehint" aria-hidden="true">
      <div className="rangehint__track">
        <span className="rangehint__band" style={{ left: pct(range[0]), width: `calc(${pct(range[1])} - ${pct(range[0])})` }} />
        {typed && number >= min && number <= max && (
          <span className={`rangehint__dot${inside ? '' : ' is-outside'}`} style={{ left: pct(number) }} />
        )}
      </div>
      <div className="rangehint__caption">
        <span>{min}</span>
        <span>typical {range[0]}–{range[1]}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
