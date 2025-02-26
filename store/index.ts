import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import roundReducer from './slices/roundSlice';
import courseReducer from './slices/courseSlice';
import playerReducer from './slices/playerSlice';
import gameReducer from './slices/gameSlice';
import themeReducer from './slices/themeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    round: roundReducer,
    course: courseReducer,
    player: playerReducer,
    game: gameReducer,
    theme: themeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 