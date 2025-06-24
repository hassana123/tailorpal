import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import shopReducer from './slices/shopSlice';
import customersReducer from './slices/customersSlice';
import ordersReducer from './slices/ordersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    shop: shopReducer,
    customers: customersReducer,
    orders: ordersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setUser', 'shop/setShop'],
        ignoredPaths: ['auth.user', 'shop.shop'],
      },
    }),
});

export default store;