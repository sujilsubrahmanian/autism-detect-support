import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, errorMessage } from '../api/client'

const initialState = {
  items: [],
  count: 0,
  listStatus: 'idle', // idle | loading | failed
  listError: null,
  current: null,
  currentStatus: 'idle',
  currentError: null,
}

export const fetchPatients = createAsyncThunk('patients/list', async (query = '', { rejectWithValue }) => {
  try {
    const qs = query ? `?q=${encodeURIComponent(query)}` : ''
    return await api.get(`/patients/${qs}`)
  } catch (err) {
    return rejectWithValue(errorMessage(err.data) || 'Could not load patients.')
  }
})

export const fetchPatient = createAsyncThunk('patients/get', async (publicId, { rejectWithValue }) => {
  try {
    return await api.get(`/patients/${publicId}/`)
  } catch (err) {
    return rejectWithValue(err.status === 404 ? 'Patient not found.' : errorMessage(err.data))
  }
})

// The raw API error is passed through so the form can show per-field messages.
export const createPatient = createAsyncThunk('patients/create', async (form, { rejectWithValue }) => {
  try {
    return await api.post('/patients/', form)
  } catch (err) {
    return rejectWithValue({ status: err.status, data: err.data })
  }
})

const slice = createSlice({
  name: 'patients',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPatients.pending, (s) => {
        s.listStatus = 'loading'
        s.listError = null
      })
      .addCase(fetchPatients.fulfilled, (s, { payload }) => {
        s.listStatus = 'idle'
        s.items = payload.results
        s.count = payload.count
      })
      .addCase(fetchPatients.rejected, (s, { payload }) => {
        s.listStatus = 'failed'
        s.listError = payload ?? 'Could not load patients.'
      })
      .addCase(fetchPatient.pending, (s) => {
        s.currentStatus = 'loading'
        s.currentError = null
        s.current = null
      })
      .addCase(fetchPatient.fulfilled, (s, { payload }) => {
        s.currentStatus = 'idle'
        s.current = payload
      })
      .addCase(fetchPatient.rejected, (s, { payload }) => {
        s.currentStatus = 'failed'
        s.currentError = payload ?? 'Could not load patient.'
      })
  },
})

export default slice.reducer
