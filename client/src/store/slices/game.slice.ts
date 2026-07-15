import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Country, Region } from '../../types';

interface GameState {
  myCountry: Country | null;
  myRegions: Region[];
  resources: any;
  isLoading: boolean;
  error: string | null;
}

const initialState: GameState = {
  myCountry: null,
  myRegions: [],
  resources: {},
  isLoading: false,
  error: null,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setCountry: (state, action: PayloadAction<Country>) => {
      state.myCountry = action.payload;
    },
    setRegions: (state, action: PayloadAction<Region[]>) => {
      state.myRegions = action.payload;
    },
    setResources: (state, action: PayloadAction<any>) => {
      state.resources = action.payload;
    },
    updateHappiness: (state, action: PayloadAction<number>) => {
      if (state.myCountry) {
        state.myCountry.happiness_level = action.payload;
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

export const { setCountry, setRegions, setResources, updateHappiness, setLoading, setError } =
  gameSlice.actions;
export default gameSlice.reducer;
