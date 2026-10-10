import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, errorMessage } from '../api/client'

const initialState = {
  schema: null,
  schemaStatus: 'idle',
  history: [], // assessments of the patient currently on screen
  historyStatus: 'idle',
  submitStatus: 'idle', // idle | loading | failed
  submitError: null, // { status, data } from the API
  lastResult: null,
}

export const fetchSchema = createAsyncThunk('assessments/schema', async (_, { rejectWithValue }) => {
  try {
    return await api.get('/ml/schema/')
  } catch (err) {
    return rejectWithValue(errorMessage(err.data))
  }
})

export const fetchAssessments = createAsyncThunk('assessments/list', async (publicId, { rejectWithValue }) => {
  try {
    const data = await api.get(`/patients/${publicId}/assessments/`)
    return data.results
  } catch (err) {
    return rejectWithValue(errorMessage(err.data))
  }
})

export const submitAssessment = createAsyncThunk(
  'assessments/submit',
  async ({ publicId, payload }, { rejectWithValue }) => {
    try {
      return await api.post(`/patients/${publicId}/assessments/`, payload)
    } catch (err) {
      return rejectWithValue({ status: err.status, data: err.data })
    }
  },
)

const slice = createSlice({
  name: 'assessments',
  initialState,
  reducers: {
    resetSubmission(state) {
      state.submitStatus = 'idle'
      state.submitError = null
      state.lastResult = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSchema.pending, (s) => {
        s.schemaStatus = 'loading'
      })
      .addCase(fetchSchema.fulfilled, (s, { payload }) => {
        s.schemaStatus = 'idle'
        s.schema = payload
      })
      .addCase(fetchSchema.rejected, (s) => {
        s.schemaStatus = 'failed'
      })
      .addCase(fetchAssessments.pending, (s) => {
        s.historyStatus = 'loading'
        s.history = [] // never flash the previous patient's records
      })
      .addCase(fetchAssessments.fulfilled, (s, { payload }) => {
        s.historyStatus = 'idle'
        s.history = payload
      })
      .addCase(fetchAssessments.rejected, (s) => {
        s.historyStatus = 'failed'
      })
      .addCase(submitAssessment.pending, (s) => {
        s.submitStatus = 'loading'
        s.submitError = null
        s.lastResult = null
      })
      .addCase(submitAssessment.fulfilled, (s, { payload }) => {
        s.submitStatus = 'idle'
        s.lastResult = payload
      })
      .addCase(submitAssessment.rejected, (s, { payload }) => {
        s.submitStatus = 'failed'
        s.submitError = payload ?? { status: 0, data: { detail: 'Network error.' } }
      })
  },
})

export const { resetSubmission } = slice.actions
export default slice.reducer
