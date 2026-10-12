import { Link } from 'react-router-dom'
import { btnPrimary, display } from '../ui'

export default function NotFoundPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className={`${display} text-8xl text-brand/90 sm:text-9xl`}>404</p>
        <h1 className={`${display} mt-2 text-3xl`}>We couldn&rsquo;t find that page</h1>
        <p className="mb-6 mt-2 text-muted">The address may be mistyped, or the page may have moved.</p>
        <Link className={btnPrimary} to="/">Back to home</Link>
      </div>
    </div>
  )
}
