import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface AuthState {
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
        document.cookie = `rims_token=${action.payload}; path=/; max-age=604800; samesite=lax`
      } else {
        localStorage.removeItem("access_token")
        document.cookie = "rims_token=; path=/; max-age=0; samesite=lax"
      }
    },
    clearToken: (state) => {
      state.token = null

      if (typeof window === "undefined") {
        return
      }

      localStorage.removeItem("access_token")
      document.cookie = "rims_token=; path=/; max-age=0; samesite=lax"
    },
    loadToken: (state) => {
      if (typeof window === "undefined") {
        return
      }

      const token = localStorage.getItem("access_token")
      state.token = token
      if (token) {
        document.cookie = `rims_token=${token}; path=/; max-age=604800; samesite=lax`
      }
    },
  },
})

export const { setToken, clearToken, loadToken } = authSlice.actions
export default authSlice.reducer
