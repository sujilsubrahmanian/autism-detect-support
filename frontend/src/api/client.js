// A thin wrapper around fetch() that:
//   1. prefixes the API base URL,
//   2. attaches the JWT access token,
//   3. transparently refreshes an expired access token ONCE and retries,
//   4. turns non-2xx responses into a typed ApiError.
//
// The store is injected (configureApi) instead of imported, which avoids a
// circular import (store -> slices -> client -> store) and makes this easy to test.

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

export class ApiError extends Error {
  constructor(status, data) {
    super(errorMessage(data) || `Request failed (${status})`)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/** Flatten DRF's error shapes into one readable sentence. */
export function errorMessage(data) {
  if (!data) return ''
  if (typeof data === 'string') return data
  if (data.detail) return String(data.detail)
  return Object.entries(data)
    .map(([field, msgs]) => `${field}: ${[].concat(msgs).join(' ')}`)
    .join(' · ')
}

/** DRF field errors -> { field: "message" } so forms can show them under each input. */
export function fieldErrors(error) {
  if (!error || error.status !== 400 || typeof error.data !== 'object' || error.data === null) return {}
  return Object.fromEntries(Object.entries(error.data).map(([k, v]) => [k, [].concat(v).join(' ')]))
}

let handlers = { getTokens: () => ({}), setTokens: () => {}, onAuthFailure: () => {} }

export function configureApi(next) {
  handlers = { ...handlers, ...next }
}

async function send(path, { method = 'GET', body, token } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  return fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

async function parse(response) {
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : null
  } catch {
    return text
  }
}

async function refreshAccessToken() {
  const { refresh } = handlers.getTokens()
  if (!refresh) return null
  const response = await send('/auth/refresh/', { method: 'POST', body: { refresh } })
  if (!response.ok) return null
  const data = await parse(response)
  handlers.setTokens({ access: data.access, refresh: data.refresh ?? refresh })
  return data.access
}

export async function request(path, options = {}) {
  const { auth = true } = options
  let response = await send(path, { ...options, token: auth ? handlers.getTokens().access : undefined })

  if (response.status === 401 && auth) {
    const newAccess = await refreshAccessToken()
    if (newAccess) {
      response = await send(path, { ...options, token: newAccess })
    } else {
      handlers.onAuthFailure() // session is really over -> log the user out
    }
  }

  const data = await parse(response)
  if (!response.ok) throw new ApiError(response.status, data)
  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body, opts) => request(path, { method: 'POST', body, ...opts }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
}
