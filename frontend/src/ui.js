// Shared Tailwind class recipes, so the screens stay short and consistent.
export const container = 'mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10'

const btn =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60'
export const btnPrimary = `${btn} bg-brand px-4 py-2.5 text-sm text-white shadow-lg shadow-brand/25 hover:bg-brand-deep hover:shadow-brand/40`
export const btnSoft = `${btn} bg-brand-wash px-3.5 py-2 text-sm text-brand-deep hover:bg-brand/15`
export const btnOutline = `${btn} border border-line-2 bg-white px-4 py-2.5 text-sm text-ink hover:border-brand hover:text-brand-deep`
export const btnLg = '!w-full !px-5 !py-3.5 !text-base'

export const card = 'rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(16,37,46,.05),0_10px_28px_rgba(16,37,46,.05)]'
export const inputCls =
  'block w-full min-h-12 rounded-xl border border-line-2 bg-white px-3.5 py-2.5 text-base text-ink placeholder:text-muted/70 transition hover:border-muted focus:border-brand focus:outline-none focus:ring-4 focus:ring-saffron/40'
export const inputErr =
  'block w-full min-h-12 rounded-xl border border-rose bg-white px-3.5 py-2.5 text-base text-ink transition focus:outline-none focus:ring-4 focus:ring-rose/20'
export const chip = 'inline-flex items-center rounded-full bg-paper-2 px-2.5 py-0.5 text-xs font-semibold text-ink-2'
export const chipMono = 'inline-flex items-center rounded-full bg-brand-wash px-2.5 py-0.5 font-mono text-xs font-semibold tracking-wide text-brand-deep'
export const eyebrow = 'text-xs font-bold uppercase tracking-[0.14em] text-brand'
export const display = 'font-display font-semibold tracking-tight'
export const skeleton = 'animate-shimmer rounded-2xl bg-[linear-gradient(100deg,#ece5d8_30%,#f6f1e7_50%,#ece5d8_70%)] bg-[length:220%_100%]'

// Literal class names (Tailwind only generates classes it can see in the source).
export const TONE = {
  low: { text: 'text-low', chip: 'bg-low text-white', top: 'bg-low', edge: 'border-l-low', soft: 'bg-low/10 text-low' },
  mid: { text: 'text-[#a86a00]', chip: 'bg-mid text-white', top: 'bg-mid', edge: 'border-l-mid', soft: 'bg-mid/15 text-[#9a5f00]' },
  high: { text: 'text-high', chip: 'bg-high text-white', top: 'bg-high', edge: 'border-l-high', soft: 'bg-high/10 text-high' },
}
