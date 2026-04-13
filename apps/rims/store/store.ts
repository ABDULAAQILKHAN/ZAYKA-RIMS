import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./auth-slice"
import { rimsApi } from "./api"

export const store = configureStore({
  reducer: {
    [rimsApi.reducerPath]: rimsApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(rimsApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
