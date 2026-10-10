import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, errorMessage } from '../api/client'
import { loadSession, saveSession } from '../lib/storage'

const saved = loadSession()

const initialState = {
  user: saved?.user ?? null,
  access: saved?.access ?? null,
  refresh: saved?.refresh ?? null,
  status: 'idle', // idle | loading | failed
  error: null,
}

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    return await api.post('/auth/login/', credentials, { auth: false })
  } catch (err) {
    return rejectWithValue(errorMessage(err.data) || 'Could not sign in.')
  }
})

export const registerDoctor = createAsyncThunk('auth/register', async (form, { dispatch, rejectWithValue }) => {
  try {
    await api.post('/auth/register/', form, { auth: false })
  } catch (err) {
    return rejectWithValue(errorMessage(err.data) || 'Could not create the account.')
  }
  // Sign in immediately so the doctor lands inside the app.
  const result = await dispatch(login({ username: form.username, password: form.password }))
  if (login.rejected.match(result)) return rejectWithValue(result.payload)
  return null
})

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      Object.assign(state, { user: null, access: null, refresh: null, status: 'idle', error: null })
      saveSession(null)
    },
    tokensRefreshed(state, { payload }) {
      state.access = payload.access
      state.refresh = payload.refresh
      saveSession({ user: state.user, access: state.access, refresh: state.refresh })
    },
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, { payload }) => {
        state.status = 'idle'
        state.user = payload.user
        state.access = payload.access
        state.refresh = payload.refresh
        saveSession({ user: payload.user, access: payload.access, refresh: payload.refresh })
      })
      .addCase(login.rejected, (state, { payload }) => {
        state.status = 'failed'
        state.error = payload ?? 'Could not sign in.'
      })
      .addCase(registerDoctor.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(registerDoctor.fulfilled, (state) => {
        state.status = 'idle'
      })
      .addCase(registerDoctor.rejected, (state, { payload }) => {
        state.status = 'failed'
        state.error = payload ?? 'Could not create the account.'
      })
  },
})

export const { logout, tokensRefreshed, clearAuthError } = slice.actions
export const selectIsAuthenticated = (state) => Boolean(state.auth.access)
export default slice.reducer
