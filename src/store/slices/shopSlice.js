import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  shop: null,
  isLoading: false,
  error: null,
};

const shopSlice = createSlice({
  name: 'shop',
  initialState,
  reducers: {
    setShop: (state, action) => {
      state.shop = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    clearShop: (state) => {
      state.shop = null;
      state.isLoading = false;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const { setShop, clearShop, setLoading, setError } = shopSlice.actions;
export default shopSlice.reducer;