import { configureStore } from '@reduxjs/toolkit'
import { configureApi } from '../api/client'
import assessments from './assessmentsSlice'
import auth, { logout, tokensRefreshed } from './authSlice'
import patients from './patientsSlice'

export function createStore(preloadedState) {
  const store = configureStore({ reducer: { auth, patients, assessments }, preloadedState })

  // Give the API client access to the tokens without importing the store itself.
  configureApi({
    getTokens: () => ({ access: store.getState().auth.access, refresh: store.getState().auth.refresh }),
    setTokens: (tokens) => store.dispatch(tokensRefreshed(tokens)),
    onAuthFailure: () => store.dispatch(logout()),
  })
  return store
}

export const store = createStore()
