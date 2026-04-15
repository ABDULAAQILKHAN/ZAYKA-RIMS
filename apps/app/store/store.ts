import { configureStore } from '@reduxjs/toolkit'
import { menuApi } from './menuApi'
import { offersApi } from './offersApi'
import { ordersApi } from './ordersApi'
import { addressApi } from './addressApi'
import { cartApi } from './cartApi'
import { dashboardApi } from './dashboardApi'
import { rimsContractApi } from './api'
import authReducer from './authSlice'

export const store = configureStore({
  reducer: {
    [menuApi.reducerPath]: menuApi.reducer,
    [offersApi.reducerPath]: offersApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
    [addressApi.reducerPath]: addressApi.reducer,
    [cartApi.reducerPath]: cartApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [rimsContractApi.reducerPath]: rimsContractApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefault) => getDefault().concat(
    menuApi.middleware, 
    offersApi.middleware, 
    ordersApi.middleware, 
    addressApi.middleware,
    cartApi.middleware,
    dashboardApi.middleware,
    rimsContractApi.middleware
  )
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
