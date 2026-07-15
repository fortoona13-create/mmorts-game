import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth.slice';
import gameReducer from './slices/game.slice';
import marketReducer from './slices/market.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    game: gameReducer,
    market: marketReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
