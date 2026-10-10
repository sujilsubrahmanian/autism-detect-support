import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="notfound">
      <p className="notfound__code">404</p>
      <h1>We couldn&rsquo;t find that page</h1>
      <p className="muted">The address may be mistyped, or the page may have moved.</p>
      <Link className="btn btn--primary" to="/">Back to the dashboard</Link>
    </div>
  )
}
