import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';
import { Tee } from './courseSlice';

export interface Player {
  id: string;
  userId?: string; // If the player is a registered user
  name: string;
  handicapIndex?: number;
  profileImageUrl?: string;
  isGuest?: boolean;
}

export interface PlayerWithTee extends Player {
  selectedTee: Tee | null;
}

interface PlayerState {
  players: Player[];
  selectedPlayers: PlayerWithTee[];
  isLoading: boolean;
  error: string | null;
}

const initialState: PlayerState = {
  players: [],
  selectedPlayers: [],
  isLoading: false,
  error: null,
};

export const fetchPlayers = createAsyncThunk(
  'player/fetchPlayers',
  async (userId: string, { rejectWithValue }) => {
    try {
      // Fetch players created by the user
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('userId', userId);
      
      if (error) throw error;
      return data as Player[];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createPlayer = createAsyncThunk(
  'player/createPlayer',
  async (player: Omit<Player, 'id'>, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('players')
        .insert(player)
        .select()
        .single();
      
      if (error) throw error;
      return data as Player;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deletePlayer = createAsyncThunk(
  'player/deletePlayer',
  async (playerId: string, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);
      
      if (error) throw error;
      return playerId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updatePlayer = createAsyncThunk(
  'player/updatePlayer',
  async (playerData: { id: string; name: string; handicapIndex?: number }, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('players')
        .update({
          name: playerData.name,
          handicap_index: playerData.handicapIndex,
          updated_at: new Date().toISOString()
        })
        .eq('id', playerData.id);
      
      if (error) throw error;
      return playerData;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    addGuestPlayer: (state, action: PayloadAction<Omit<Player, 'id' | 'isGuest'>>) => {
      const guestPlayer: Player = {
        ...action.payload,
        id: `guest-${Date.now()}`,
        isGuest: true,
      };
      state.players.push(guestPlayer);
    },
    selectPlayer: (state, action: PayloadAction<{ player: Player; tee: Tee | null }>) => {
      const { player, tee } = action.payload;
      // Check if player is already selected
      const existingIndex = state.selectedPlayers.findIndex(p => p.id === player.id);
      
      if (existingIndex >= 0) {
        // Update the tee if player is already selected
        state.selectedPlayers[existingIndex].selectedTee = tee;
      } else {
        // Add player with selected tee
        state.selectedPlayers.push({
          ...player,
          selectedTee: tee,
        });
      }
    },
    removeSelectedPlayer: (state, action: PayloadAction<string>) => {
      state.selectedPlayers = state.selectedPlayers.filter(p => p.id !== action.payload);
    },
    clearSelectedPlayers: (state) => {
      state.selectedPlayers = [];
    },
    updatePlayerTee: (state, action: PayloadAction<{ playerId: string; tee: Tee }>) => {
      const { playerId, tee } = action.payload;
      const playerIndex = state.selectedPlayers.findIndex(p => p.id === playerId);
      if (playerIndex >= 0) {
        state.selectedPlayers[playerIndex].selectedTee = tee;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Players
      .addCase(fetchPlayers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPlayers.fulfilled, (state, action: PayloadAction<Player[]>) => {
        state.isLoading = false;
        state.players = action.payload;
      })
      .addCase(fetchPlayers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Player
      .addCase(createPlayer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPlayer.fulfilled, (state, action: PayloadAction<Player>) => {
        state.isLoading = false;
        state.players.push(action.payload);
      })
      .addCase(createPlayer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete Player
      .addCase(deletePlayer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deletePlayer.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.players = state.players.filter(player => player.id !== action.payload);
        // Also remove from selected players if present
        state.selectedPlayers = state.selectedPlayers.filter(player => player.id !== action.payload);
      })
      .addCase(deletePlayer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Player
      .addCase(updatePlayer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePlayer.fulfilled, (state, action) => {
        state.isLoading = false;
        const { id, name, handicapIndex } = action.payload;
        state.players = state.players.map(player => 
          player.id === id 
            ? { ...player, name, handicapIndex } 
            : player
        );
      })
      .addCase(updatePlayer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  addGuestPlayer,
  selectPlayer,
  removeSelectedPlayer,
  clearSelectedPlayers,
  updatePlayerTee,
} = playerSlice.actions;

export default playerSlice.reducer; 