import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  customers: [],
  isLoading: false,
  error: null,
};

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setCustomers: (state, action) => {
      state.customers = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    addCustomer: (state, action) => {
      state.customers.push(action.payload);
      state.error = null;
    },
    updateCustomer: (state, action) => {
      const index = state.customers.findIndex(customer => customer.id === action.payload.id);
      if (index !== -1) {
        state.customers[index] = action.payload;
      }
      state.error = null;
    },
    deleteCustomer: (state, action) => {
      state.customers = state.customers.filter(customer => customer.id !== action.payload);
      state.error = null;
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
  setCustomers, 
  addCustomer, 
  updateCustomer, 
  deleteCustomer,
  setLoading, 
  setError, 
  clearError 
} = customersSlice.actions;

export default customersSlice.reducer;