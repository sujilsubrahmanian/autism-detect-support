import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, configureApi, errorMessage, fieldErrors, request } from '../api/client'

const json = (status, body) => ({ ok: status < 400, status, text: async () => JSON.stringify(body) })

describe('error helpers', () => {
  it('prefers DRF "detail"', () => expect(errorMessage({ detail: 'Nope' })).toBe('Nope'))
  it('flattens field errors', () => expect(errorMessage({ fiq: ['Too low.'] })).toBe('fiq: Too low.'))
  it('fieldErrors only maps 400 responses', () => {
    expect(fieldErrors({ status: 400, data: { fiq: ['bad'] } })).toEqual({ fiq: 'bad' })
    expect(fieldErrors({ status: 500, data: { fiq: ['bad'] } })).toEqual({})
  })
})

describe('request()', () => {
  let tokens
  const onAuthFailure = vi.fn()
  beforeEach(() => {
    tokens = { access: 'old', refresh: 'ref' }
    onAuthFailure.mockClear()
    configureApi({ getTokens: () => tokens, setTokens: (t) => { tokens = t }, onAuthFailure })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('sends the bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(200, { ok: 1 }))
    vi.stubGlobal('fetch', fetchMock)
    await request('/patients/')
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer old')
  })

  it('refreshes once on 401 and retries with the new token', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json(401, { detail: 'expired' }))
      .mockResolvedValueOnce(json(200, { access: 'new' }))
      .mockResolvedValueOnce(json(200, { results: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const data = await request('/patients/')
    expect(data).toEqual({ results: [] })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer new')
    expect(tokens.access).toBe('new')
  })

  it('logs out when the refresh token is rejected too', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(401, { detail: 'bad' }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(request('/patients/')).rejects.toBeInstanceOf(ApiError)
    expect(onAuthFailure).toHaveBeenCalled()
  })

  it('does not try to refresh for unauthenticated calls such as login', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(401, { detail: 'Invalid credentials' }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(request('/auth/login/', { method: 'POST', body: {}, auth: false })).rejects.toThrow('Invalid credentials')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
