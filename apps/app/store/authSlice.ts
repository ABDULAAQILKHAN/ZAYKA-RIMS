import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface AuthState {
  token: string | null
}

const initialState: AuthState = {
  token: null
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload
      if (typeof window !== 'undefined') {
        if (action.payload) {
          localStorage.setItem('access_token', action.payload)
        } else {
          localStorage.removeItem('access_token')
        }
      }
    },
    clearToken: (state) => {
      state.token = null
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
      }
    },
    loadToken: (state) => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('access_token')
        if (stored) state.token = stored
      }
    }
  }
})

export const { setToken, clearToken, loadToken } = authSlice.actions
export default authSlice.reducer
