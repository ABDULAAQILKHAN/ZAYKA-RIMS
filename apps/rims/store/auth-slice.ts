import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface AuthState {
  token: string | null
}

const initialState: AuthState = {
  token: null,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload

      if (typeof window === "undefined") {
        return
      }

      if (action.payload) {
        localStorage.setItem("access_token", action.payload)
      } else {
        localStorage.removeItem("access_token")
      }
    },
    clearToken: (state) => {
      state.token = null

      if (typeof window === "undefined") {
        return
      }

      localStorage.removeItem("access_token")
    },
    loadToken: (state) => {
      if (typeof window === "undefined") {
        return
      }

      const token = localStorage.getItem("access_token")
      state.token = token
    },
  },
})

export const { setToken, clearToken, loadToken } = authSlice.actions
export default authSlice.reducer
