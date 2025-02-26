import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';
import { Course } from './courseSlice';
import { PlayerWithTee } from './playerSlice';

export type HoleSelection = 'front9' | 'back9' | 'full18' | 'custom';
export type HoleScore = {
  playerId: string;
  holeNumber: number;
  strokes: number;
  putts?: number;
  fairwayHit?: boolean;
  greenInRegulation?: boolean;
  penalties?: number;
};

export interface Round {
  id: string;
  userId: string;
  courseId: string;
  course?: Course;
  date: string;
  players: PlayerWithTee[];
  holeSelection: HoleSelection;
  customStartHole?: number;
  scores: HoleScore[];
  isCompleted: boolean;
  games?: string[]; // IDs of games associated with this round
  weather?: {
    temperature?: number;
    conditions?: string;
    windSpeed?: number;
  };
}

interface RoundState {
  currentRound: Round | null;
  pastRounds: Round[];
  isLoading: boolean;
  error: string | null;
}

const initialState: RoundState = {
  currentRound: null,
  pastRounds: [],
  isLoading: false,
  error: null,
};

export const fetchPastRounds = createAsyncThunk(
  'round/fetchPastRounds',
  async (userId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .eq('userId', userId)
        .eq('isCompleted', true)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as Round[];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const saveRound = createAsyncThunk(
  'round/saveRound',
  async (round: Omit<Round, 'id'>, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('rounds')
        .insert(round)
        .select()
        .single();
      
      if (error) throw error;
      return data as Round;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateRound = createAsyncThunk(
  'round/updateRound',
  async (round: Round, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('rounds')
        .update(round)
        .eq('id', round.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Round;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const completeRound = createAsyncThunk(
  'round/completeRound',
  async (roundId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { round: RoundState };
      const round = state.round.currentRound;
      
      if (!round) throw new Error('No current round found');
      
      const { data, error } = await supabase
        .from('rounds')
        .update({ isCompleted: true })
        .eq('id', roundId)
        .select()
        .single();
      
      if (error) throw error;
      return data as Round;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const roundSlice = createSlice({
  name: 'round',
  initialState,
  reducers: {
    startNewRound: (state, action: PayloadAction<{
      course: Course;
      players: PlayerWithTee[];
      holeSelection: HoleSelection;
      customStartHole?: number;
      userId: string;
    }>) => {
      const { course, players, holeSelection, customStartHole, userId } = action.payload;
      
      state.currentRound = {
        id: `temp-${Date.now()}`, // Temporary ID until saved to database
        userId,
        courseId: course.id,
        course,
        date: new Date().toISOString(),
        players,
        holeSelection,
        customStartHole,
        scores: [],
        isCompleted: false,
      };
    },
    addScore: (state, action: PayloadAction<HoleScore>) => {
      if (!state.currentRound) return;
      
      // Check if score for this hole and player already exists
      const existingScoreIndex = state.currentRound.scores.findIndex(
        score => score.playerId === action.payload.playerId && score.holeNumber === action.payload.holeNumber
      );
      
      if (existingScoreIndex >= 0) {
        // Update existing score
        state.currentRound.scores[existingScoreIndex] = action.payload;
      } else {
        // Add new score
        state.currentRound.scores.push(action.payload);
      }
    },
    updateScore: (state, action: PayloadAction<HoleScore>) => {
      if (!state.currentRound) return;
      
      const { playerId, holeNumber } = action.payload;
      const scoreIndex = state.currentRound.scores.findIndex(
        score => score.playerId === playerId && score.holeNumber === holeNumber
      );
      
      if (scoreIndex >= 0) {
        state.currentRound.scores[scoreIndex] = action.payload;
      }
    },
    clearCurrentRound: (state) => {
      state.currentRound = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Past Rounds
      .addCase(fetchPastRounds.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPastRounds.fulfilled, (state, action: PayloadAction<Round[]>) => {
        state.isLoading = false;
        state.pastRounds = action.payload;
      })
      .addCase(fetchPastRounds.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Save Round
      .addCase(saveRound.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveRound.fulfilled, (state, action: PayloadAction<Round>) => {
        state.isLoading = false;
        if (state.currentRound) {
          state.currentRound.id = action.payload.id;
        }
      })
      .addCase(saveRound.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Round
      .addCase(updateRound.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateRound.fulfilled, (state, action: PayloadAction<Round>) => {
        state.isLoading = false;
        state.currentRound = action.payload;
      })
      .addCase(updateRound.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Complete Round
      .addCase(completeRound.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(completeRound.fulfilled, (state, action: PayloadAction<Round>) => {
        state.isLoading = false;
        state.pastRounds.unshift(action.payload);
        state.currentRound = null;
      })
      .addCase(completeRound.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  startNewRound,
  addScore,
  updateScore,
  clearCurrentRound,
} = roundSlice.actions;

export default roundSlice.reducer; 