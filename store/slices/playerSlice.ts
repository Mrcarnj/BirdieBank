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
  email?: string;
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
  async (userId: string, { rejectWithValue, getState }) => {
    try {
      console.log('Fetching players for user ID:', userId);
      
      // Get the current user from the auth state
      const state = getState() as { auth: { user: any } };
      const currentUser = state.auth.user;
      
      // Fetch friends from the database - modify the query to avoid the embedding error
      console.log('Fetching friends from database for user ID:', userId);
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select('*')  // Remove the users(*) join that's causing the error
        .eq('user_id', userId);
      
      if (friendsError) {
        console.error('Error fetching friends:', friendsError);
        throw friendsError;
      }
      
      console.log('Friends data from database:', friendsData);
      console.log('Number of friends found:', friendsData?.length || 0);
      
      // Log each friend individually for better debugging
      if (friendsData) {
        friendsData.forEach((friend: any, index: number) => {
          console.log(`Friend ${index}: ID=${friend.id}, Name=${friend.name}, isGuest=${friend.is_guest}`);
        });
      }
      
      // Convert friends data to Player objects
      const players = friendsData.map((friend: any) => ({
        id: friend.id,
        userId: friend.friend_user_id,
        name: friend.name,
        handicapIndex: friend.handicap_index,
        profileImageUrl: friend.profile_image_url,
        isGuest: friend.is_guest || false,
        email: friend.email
      }));
      
      console.log('Converted players:', players);
      
      // Add the current user to the players list if they're not already included
      if (currentUser) {
        const isUserAlreadyIncluded = players.some(player => player.userId === currentUser.id);
        
        if (!isUserAlreadyIncluded) {
          // Create a name from first_name and last_name
          const userName = currentUser.name || 
            (currentUser.first_name && currentUser.last_name 
              ? `${currentUser.first_name} ${currentUser.last_name}`
              : currentUser.first_name || currentUser.last_name || currentUser.email.split('@')[0]);
          
          players.unshift({
            id: currentUser.id,
            userId: currentUser.id,
            name: userName,
            handicapIndex: currentUser.handicap,
            profileImageUrl: currentUser.profile_image_url,
            isGuest: false
          });
        }
      }
      
      console.log('Final players list:', players);
      console.log('Number of players after processing:', players.length);
      
      // Log each player individually for better debugging
      players.forEach((player: Player, index: number) => {
        console.log(`Player ${index}: Name=${player.name}, ID=${player.id}, isGuest=${player.isGuest}`);
      });
      
      return players as Player[];
    } catch (error: any) {
      console.error('Error fetching players:', error.message);
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

// Add a function to create a new friend in the database
export const createFriend = createAsyncThunk(
  'player/createFriend',
  async (
    { 
      userId, 
      firstName, 
      lastName, 
      handicapIndex, 
      email 
    }: { 
      userId: string; 
      firstName: string; 
      lastName: string; 
      handicapIndex?: number; 
      email?: string; 
    }, 
    { rejectWithValue }
  ) => {
    try {
      // Create the friend in the database
      const { data: friendData, error: friendError } = await supabase
        .from('friends')
        .insert([
          {
            user_id: userId,
            name: `${firstName} ${lastName}`,
            handicap_index: handicapIndex,
            is_guest: true, // Mark as guest since it's not linked to a user account
            email: email // Store email in the friends table
          }
        ])
        .select()
        .single();
      
      if (friendError) throw friendError;
      
      // Convert the friend data to a Player object
      const player: Player = {
        id: friendData.id,
        userId: friendData.friend_user_id,
        name: friendData.name,
        handicapIndex: friendData.handicap_index,
        profileImageUrl: friendData.profile_image_url,
        isGuest: friendData.is_guest || true,
        email: friendData.email // Get email from the database response
      };
      
      return player;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Add a function to ensure the current user exists in the friends table
export const ensureUserInFriendsTable = createAsyncThunk(
  'player/ensureUserInFriendsTable',
  async (userId: string, { rejectWithValue, getState }) => {
    try {
      console.log('Ensuring user exists in friends table:', userId);
      
      // Get the current user from the auth state
      const state = getState() as { auth: { user: any } };
      const currentUser = state.auth.user;
      
      if (!currentUser) {
        throw new Error('No current user found');
      }
      
      // Check if the user already exists in the friends table
      const { data: existingFriend, error: checkError } = await supabase
        .from('friends')
        .select('id')
        .eq('user_id', userId)
        .eq('friend_user_id', userId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        console.error('Error checking if user exists in friends table:', checkError);
        throw checkError;
      }
      
      // If the user already exists in the friends table, return their friend record
      if (existingFriend) {
        console.log('User already exists in friends table:', existingFriend);
        return existingFriend.id;
      }
      
      // Create a name from first_name and last_name
      const userName = currentUser.name || 
        (currentUser.first_name && currentUser.last_name 
          ? `${currentUser.first_name} ${currentUser.last_name}`
          : currentUser.first_name || currentUser.last_name || currentUser.email.split('@')[0]);
      
      // Insert the user into the friends table
      console.log('Adding user to friends table:', userName);
      const { data: newFriend, error: insertError } = await supabase
        .from('friends')
        .insert({
          user_id: userId,
          friend_user_id: userId,
          name: userName,
          handicap_index: currentUser.handicap,
          profile_image_url: currentUser.profile_image_url,
          is_guest: false,
          email: currentUser.email
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error adding user to friends table:', insertError);
        throw insertError;
      }
      
      console.log('User added to friends table:', newFriend);
      return newFriend.id;
    } catch (error: any) {
      console.error('Error ensuring user in friends table:', error.message);
      return rejectWithValue(error.message);
    }
  }
);

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    addGuestPlayer: (state, action: PayloadAction<Player>) => {
      // Add the guest player to the players list
      state.players.push(action.payload);
    },
    selectPlayer: (state, action: PayloadAction<{ player: Player, tee: Tee | null }>) => {
      const { player, tee } = action.payload;
      
      // Check if player is already selected
      const existingIndex = state.selectedPlayers.findIndex(p => p.id === player.id);
      
      if (existingIndex >= 0) {
        // If tee is null, remove the player from selected players
        if (tee === null) {
          state.selectedPlayers = state.selectedPlayers.filter(p => p.id !== player.id);
        } else {
          // Update the tee for the existing player
          state.selectedPlayers[existingIndex] = {
            ...state.selectedPlayers[existingIndex],
            selectedTee: tee
          };
        }
      } else {
        // Add the player with the selected tee
        state.selectedPlayers.push({
          ...player,
          selectedTee: tee
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
      .addCase(fetchPlayers.fulfilled, (state, action) => {
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
      })
      // Handle createFriend
      .addCase(createFriend.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createFriend.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add the new player to the players array
        state.players.push(action.payload);
      })
      .addCase(createFriend.rejected, (state, action) => {
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