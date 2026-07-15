import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MarketPrice, MarketOrder } from '../../types';

interface MarketState {
  prices: MarketPrice[];
  orders: MarketOrder[];
  isLoading: boolean;
  error: string | null;
}

const initialState: MarketState = {
  prices: [],
  orders: [],
  isLoading: false,
  error: null,
};

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    setPrices: (state, action: PayloadAction<MarketPrice[]>) => {
      state.prices = action.payload;
    },
    setOrders: (state, action: PayloadAction<MarketOrder[]>) => {
      state.orders = action.payload;
    },
    updatePrice: (state, action: PayloadAction<MarketPrice>) => {
      const index = state.prices.findIndex((p) => p.resource_type === action.payload.resource_type);
      if (index !== -1) {
        state.prices[index] = action.payload;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setPrices, setOrders, updatePrice, setLoading, setError } = marketSlice.actions;
export default marketSlice.reducer;
