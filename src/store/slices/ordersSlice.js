import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orders: [],
  activeOrder: null, // For storing the currently viewed/edited order
  isLoading: false,
  error: null,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders: (state, action) => {
      state.orders = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    addOrder: (state, action) => {
      state.orders.push(action.payload);
      state.error = null;
    },
    updateOrder: (state, action) => {
      const index = state.orders.findIndex(order => order.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
      // Also update activeOrder if it's the same order
      if (state.activeOrder && state.activeOrder.id === action.payload.id) {
        state.activeOrder = action.payload;
      }
      state.error = null;
    },
    deleteOrder: (state, action) => {
      state.orders = state.orders.filter(order => order.id !== action.payload);
      // Clear activeOrder if it was the deleted order
      if (state.activeOrder && state.activeOrder.id === action.payload) {
        state.activeOrder = null;
      }
      state.error = null;
    },
    setActiveOrder: (state, action) => {
      state.activeOrder = action.payload;
    },
    clearActiveOrder: (state) => {
      state.activeOrder = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { 
  setOrders, 
  addOrder, 
  updateOrder, 
  deleteOrder,
  setActiveOrder,
  clearActiveOrder,
  setLoading, 
  setError, 
  clearError 
} = ordersSlice.actions;

export default ordersSlice.reducer;