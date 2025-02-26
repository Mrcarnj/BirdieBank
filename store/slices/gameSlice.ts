import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PlayerWithTee } from './playerSlice';

export type GameType = 'nassau' | 'skins' | 'match-play' | 'stableford' | 'vegas' | 'wolf';

export interface GameResult {
  playerId: string;
  points: number;
  amount: number;
}

export interface Game {
  id: string;
  type: GameType;
  players: string[]; // Player IDs
  stake: number;
  results: GameResult[];
  settings?: Record<string, any>; // Game-specific settings
}

interface GameState {
  availableGames: {
    type: GameType;
    name: string;
    description: string;
  }[];
  selectedGames: Game[];
  isLoading: boolean;
  error: string | null;
}

const initialState: GameState = {
  availableGames: [
    {
      type: 'nassau',
      name: 'Nassau',
      description: 'Front 9, Back 9, and Total 18 bets',
    },
    {
      type: 'skins',
      name: 'Skins',
      description: 'Win a hole outright to win a skin',
    },
    {
      type: 'match-play',
      name: 'Match Play',
      description: 'Play hole by hole against opponents',
    },
    {
      type: 'stableford',
      name: 'Stableford',
      description: 'Points based on score relative to par',
    },
    {
      type: 'vegas',
      name: 'Vegas',
      description: 'Team game with unique scoring system',
    },
    {
      type: 'wolf',
      name: 'Wolf',
      description: 'Rotating team selection on each hole',
    },
  ],
  selectedGames: [],
  isLoading: false,
  error: null,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    selectGame: (state, action: PayloadAction<{
      type: GameType;
      players: PlayerWithTee[];
      stake: number;
      settings?: Record<string, any>;
    }>) => {
      const { type, players, stake, settings } = action.payload;
      
      const game: Game = {
        id: `game-${Date.now()}-${type}`,
        type,
        players: players.map(p => p.id),
        stake,
        results: players.map(p => ({
          playerId: p.id,
          points: 0,
          amount: 0,
        })),
        settings,
      };
      
      state.selectedGames.push(game);
    },
    removeGame: (state, action: PayloadAction<string>) => {
      state.selectedGames = state.selectedGames.filter(game => game.id !== action.payload);
    },
    updateGameResults: (state, action: PayloadAction<{
      gameId: string;
      results: GameResult[];
    }>) => {
      const { gameId, results } = action.payload;
      const gameIndex = state.selectedGames.findIndex(game => game.id === gameId);
      
      if (gameIndex >= 0) {
        state.selectedGames[gameIndex].results = results;
      }
    },
    clearSelectedGames: (state) => {
      state.selectedGames = [];
    },
  },
});

export const {
  selectGame,
  removeGame,
  updateGameResults,
  clearSelectedGames,
} = gameSlice.actions;

export default gameSlice.reducer; 