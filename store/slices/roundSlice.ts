import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase, SupabaseTransaction } from '../../lib/supabase';
import { Course } from './courseSlice';
import { PlayerWithTee } from './playerSlice';
import { updateRoundWithNetScores, formatRoundData } from '../../utils/roundUtils';
import { ensureUserInFriendsTable } from './playerSlice';

export type HoleSelection = 'front9' | 'back9' | 'full18' | 'custom';
export type HoleScore = {
  playerId: string;
  holeNumber: number;
  strokes: number;
  putts?: number;
  fairwayHit?: boolean;
  greenInRegulation?: boolean;
  penalties?: number;
  isNetScore?: boolean;
  closestToPin?: boolean;
  bunkerShot?: boolean;
  hitTree?: boolean;
  longPutt?: boolean;
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
  customEndHole?: number;
  scores: HoleScore[];
  netScores?: HoleScore[]; // Net scores after handicap adjustments
  isCompleted: boolean;
  games?: string[]; // IDs of games associated with this round
  weather?: {
    temperature?: number;
    conditions?: string;
    windSpeed?: number;
  };
  notes?: string;
  playingHandicaps?: Record<string, number>; // Playing handicaps for each player
  courseHandicaps?: Record<string, number>; // Course handicaps for each player
  strokesReceived?: Record<string, Record<number, number>>; // Strokes received by each player on each hole
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
      // Fetch rounds from the database
      const { data: roundsData, error: roundsError } = await supabase
        .from('rounds')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', true)
        .order('date', { ascending: false });
      
      if (roundsError) throw roundsError;
      
      // For each round, fetch the associated players and scores
      const rounds = await Promise.all(roundsData.map(async (round) => {
        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', round.course_id)
          .single();
        
        if (courseError) throw courseError;
        
        // Fetch round players
        const { data: roundPlayersData, error: playersError } = await supabase
          .from('round_players')
          .select('*, friends(*), tee_sets(*)')
          .eq('round_id', round.id);
        
        if (playersError) throw playersError;
        
        // Fetch scores for each player
        const players = await Promise.all(roundPlayersData.map(async (roundPlayer) => {
          const { data: scoresData, error: scoresError } = await supabase
            .from('scores')
            .select('*')
            .eq('round_player_id', roundPlayer.id);
          
          if (scoresError) throw scoresError;
          
          return {
            id: roundPlayer.friends.id,
            name: roundPlayer.friends.name,
            handicapIndex: roundPlayer.handicap_at_time,
            profileImageUrl: roundPlayer.friends.profile_image_url,
            isGuest: roundPlayer.friends.is_guest,
            selectedTee: roundPlayer.tee_sets,
            scores: scoresData.map(score => ({
              holeNumber: score.hole_number,
              strokes: score.strokes,
              putts: score.putts,
              fairwayHit: score.fairway_hit,
              greenInRegulation: score.green_in_regulation,
              penalties: score.penalties
            }))
          };
        }));
        
        // Fetch games for the round
        const { data: gamesData, error: gamesError } = await supabase
          .from('round_games')
          .select('*, games(*)')
          .eq('round_id', round.id);
        
        if (gamesError) throw gamesError;
        
        // Transform the data to match our Round interface
        return {
          id: round.id,
          userId: round.user_id,
          courseId: round.course_id,
          course: courseData,
          date: round.date,
          players: players,
          holeSelection: round.hole_selection as HoleSelection,
          customStartHole: round.custom_start_hole,
          customEndHole: round.custom_end_hole,
          scores: players.flatMap(player => 
            player.scores.map(score => ({
              playerId: player.id,
              ...score
            }))
          ),
          isCompleted: round.is_completed,
          games: gamesData.map(game => game.games.id),
          weather: {
            temperature: round.weather_temperature,
            conditions: round.weather_conditions,
            windSpeed: round.weather_wind_speed
          },
          notes: round.notes
        };
      }));
      
      return rounds;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const saveRound = createAsyncThunk(
  'round/saveRound',
  async (round: Round, { rejectWithValue, dispatch }) => {
    try {
      // First, ensure the current user exists in the friends table
      console.log('Ensuring user exists in friends table before saving round:', round.userId);
      const userFriendId = await dispatch(ensureUserInFriendsTable(round.userId)).unwrap();
      console.log('User friend ID:', userFriendId);
      console.log('Original round players:', round.players);
      
      // Map player IDs to ensure the current user's ID is replaced with their friend_id
      const mappedPlayers = round.players.map(player => {
        if (player.id === round.userId) {
          console.log('Replacing user ID with friend ID for round player:', userFriendId);
          return {
            ...player,
            id: userFriendId
          };
        }
        return player;
      });
      
      console.log('Mapped players:', mappedPlayers);
      
      return await SupabaseTransaction.execute(async () => {
        // 1. Insert the round
        const { data: roundData, error: roundError } = await supabase
          .from('rounds')
          .insert({
            user_id: round.userId,
            course_id: round.courseId,
            date: round.date,
            hole_selection: round.holeSelection,
            custom_start_hole: round.customStartHole,
            custom_end_hole: round.customEndHole,
            is_completed: round.isCompleted,
            weather_temperature: round.weather?.temperature,
            weather_conditions: round.weather?.conditions,
            weather_wind_speed: round.weather?.windSpeed,
            notes: round.notes
          })
          .select()
          .single();
        
        if (roundError) throw roundError;
        
        console.log('Inserted round:', roundData);
        
        // 2. Insert round players with mapped player IDs
        for (const player of mappedPlayers) {
          console.log('Inserting round player:', player.id, player.name);
          const { data: roundPlayerData, error: playerError } = await supabase
            .from('round_players')
            .insert({
              round_id: roundData.id,
              friend_id: player.id,
              tee_set_id: player.selectedTee?.id,
              handicap_at_time: player.handicapIndex
            })
            .select()
            .single();
          
          if (playerError) {
            console.error('Error inserting round player:', playerError);
            throw playerError;
          }
          
          console.log('Inserted round player:', roundPlayerData);
          
          // 3. Insert scores for this player - map the playerId if it's the current user
          // Determine the correct playerId to filter scores
          const scorePlayerId = player.id === userFriendId ? round.userId : player.id;
          
          const playerScores = round.scores
            .filter(score => score.playerId === scorePlayerId)
            .map(score => ({
              ...score,
              playerId: player.id // Use the mapped player ID
            }));
            
          if (playerScores.length > 0) {
            const scoresForInsert = playerScores.map(score => ({
              round_player_id: roundPlayerData.id,
              hole_number: score.holeNumber,
              strokes: score.strokes,
              putts: score.putts,
              fairway_hit: score.fairwayHit,
              green_in_regulation: score.greenInRegulation,
              penalties: score.penalties,
              par: round.course?.holes.find(h => h.number === score.holeNumber)?.par || 4
            }));
            
            const { error: scoresError } = await supabase
              .from('scores')
              .insert(scoresForInsert);
            
            if (scoresError) throw scoresError;
          }
        }
        
        // 4. Insert games if any
        if (round.games && round.games.length > 0) {
          const gamesForInsert = round.games.map(gameId => ({
            round_id: roundData.id,
            game_id: gameId,
            settings: {} // Default empty settings
          }));
          
          const { error: gamesError } = await supabase
            .from('round_games')
            .insert(gamesForInsert);
          
          if (gamesError) throw gamesError;
        }
        
        // Return the saved round with its new ID
        return {
          ...round,
          id: roundData.id
        };
      });
    } catch (error: any) {
      console.error('Failed to save round:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const updateRound = createAsyncThunk(
  'round/updateRound',
  async (round: Round, { rejectWithValue, dispatch }) => {
    try {
      // First, ensure the current user exists in the friends table
      console.log('Ensuring user exists in friends table before updating round:', round.userId);
      const userFriendId = await dispatch(ensureUserInFriendsTable(round.userId)).unwrap();
      
      return await SupabaseTransaction.execute(async () => {
        // 1. Update the round
        const { error: roundError } = await supabase
          .from('rounds')
          .update({
            date: round.date,
            hole_selection: round.holeSelection,
            custom_start_hole: round.customStartHole,
            custom_end_hole: round.customEndHole,
            is_completed: round.isCompleted,
            weather_temperature: round.weather?.temperature,
            weather_conditions: round.weather?.conditions,
            weather_wind_speed: round.weather?.windSpeed,
            notes: round.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', round.id);
        
        if (roundError) throw roundError;
        
        // 2. Get existing round players
        const { data: existingPlayers, error: playersQueryError } = await supabase
          .from('round_players')
          .select('id, friend_id')
          .eq('round_id', round.id);
        
        if (playersQueryError) throw playersQueryError;
        
        // Create a map of friend_id to round_player_id
        const playerMap = new Map(existingPlayers.map((p: any) => [p.friend_id, p.id]));
        
        // 3. Update scores for each player
        for (const player of round.players) {
          // Map the player ID if it's the current user
          const mappedPlayerId = player.id === round.userId ? userFriendId : player.id;
          
          const roundPlayerId = playerMap.get(mappedPlayerId);
          
          if (!roundPlayerId) {
            // This is a new player, insert them
            const { data: newPlayer, error: newPlayerError } = await supabase
              .from('round_players')
              .insert({
                round_id: round.id,
                friend_id: mappedPlayerId,
                tee_set_id: player.selectedTee?.id,
                handicap_at_time: player.handicapIndex
              })
              .select()
              .single();
            
            if (newPlayerError) throw newPlayerError;
            
            // Add to our map
            playerMap.set(mappedPlayerId, newPlayer.id);
          } else {
            // Update existing player
            const { error: updatePlayerError } = await supabase
              .from('round_players')
              .update({
                tee_set_id: player.selectedTee?.id,
                updated_at: new Date().toISOString()
              })
              .eq('id', roundPlayerId);
            
            if (updatePlayerError) throw updatePlayerError;
          }
          
          // Determine the correct playerId to filter scores
          const scorePlayerId = player.id === userFriendId ? round.userId : player.id;
          
          // Get scores for this player
          const playerScores = round.scores.filter(score => score.playerId === scorePlayerId);
          
          if (playerScores.length > 0) {
            const roundPlayerId = playerMap.get(mappedPlayerId);
            
            // Get existing scores
            const { data: existingScores, error: scoresQueryError } = await supabase
              .from('scores')
              .select('*')
              .eq('round_player_id', roundPlayerId);
            
            if (scoresQueryError) throw scoresQueryError;
            
            // Map of existing scores by hole number
            const scoreMap = new Map(existingScores.map(s => [s.hole_number, s.id]));
            
            // Update or insert scores
            for (const score of playerScores) {
              const scoreId = scoreMap.get(score.holeNumber);
              
              if (scoreId) {
                // Update existing score
                const { error: updateScoreError } = await supabase
                  .from('scores')
                  .update({
                    strokes: score.strokes,
                    putts: score.putts,
                    fairway_hit: score.fairwayHit,
                    green_in_regulation: score.greenInRegulation,
                    penalties: score.penalties,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', scoreId);
                
                if (updateScoreError) throw updateScoreError;
              } else {
                // Insert new score
                const { error: insertScoreError } = await supabase
                  .from('scores')
                  .insert({
                    round_player_id: roundPlayerId,
                    hole_number: score.holeNumber,
                    strokes: score.strokes,
                    putts: score.putts,
                    fairway_hit: score.fairwayHit,
                    green_in_regulation: score.greenInRegulation,
                    penalties: score.penalties,
                    par: round.course?.holes.find(h => h.number === score.holeNumber)?.par || 4
                  });
                
                if (insertScoreError) throw insertScoreError;
              }
            }
          }
        }
        
        return round;
      });
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const completeRound = createAsyncThunk(
  'round/completeRound',
  async (roundId: string, { getState, rejectWithValue, dispatch }) => {
    try {
      const state = getState() as { round: RoundState; auth: { user: any } };
      const round = state.round.currentRound;
      const currentUser = state.auth.user;
      
      if (!round) throw new Error('No current round found');
      if (!currentUser) throw new Error('No current user found');
      
      // First, ensure the current user exists in the friends table to get their friend_id
      console.log('Ensuring user exists in friends table before completing round:', round.userId);
      const userFriendId = await dispatch(ensureUserInFriendsTable(round.userId)).unwrap();
      console.log('User friend ID:', userFriendId);
      
      // Calculate total scores for each player
      const playerTotals = round.players.map(player => {
        // Determine the correct playerId to filter scores
        // If this is the current user's player entry, we need to check scores with the user's ID
        const scorePlayerId = player.id === userFriendId ? round.userId : player.id;
        
        // Get scores for this player
        const playerScores = round.scores.filter(score => score.playerId === scorePlayerId);
        const totalScore = playerScores.reduce((sum, score) => sum + score.strokes, 0);
        
        // Calculate course handicap using the formula: (Handicap Index × Slope Rating / 113) + (Course Rating - Par)
        let courseHandicap = 0;
        if (player.handicapIndex !== undefined && player.selectedTee) {
          const slope = player.selectedTee.slope || 113;
          const rating = player.selectedTee.rating || 72;
          // Get par from course holes if available, otherwise default to 72
          const par = round.course?.holes?.reduce((total, hole) => total + (hole.par || 4), 0) || 72;
          
          courseHandicap = Math.round((player.handicapIndex * slope / 113) + (rating - par));
        }
        
        // Calculate net score as total score minus course handicap
        const netScore = Math.max(0, totalScore - courseHandicap);
        
        console.log(`Player ${player.name} (ID: ${player.id}): Total Score = ${totalScore}, Course Handicap = ${courseHandicap}, Net Score = ${netScore}`);
        
        return {
          playerId: player.id,
          totalScore,
          netScore,
          courseHandicap
        };
      });
      
      return await SupabaseTransaction.execute(async () => {
        // 1. Mark the round as completed
        const { data: updatedRound, error: roundError } = await supabase
          .from('rounds')
          .update({ 
            is_completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', roundId)
          .select()
          .single();
        
        if (roundError) throw roundError;
        
        // 2. Update total scores for each player
        const { data: roundPlayers, error: playersError } = await supabase
          .from('round_players')
          .select('*')
          .eq('round_id', roundId);
        
        if (playersError) throw playersError;
        
        console.log('Round players from database:', roundPlayers);
        
        // Check if we have any round players
        if (roundPlayers.length === 0) {
          console.error('No round players found for round ID:', roundId);
          throw new Error('No round players found');
        }
        
        for (const roundPlayer of roundPlayers) {
          console.log(`Processing round player: ${JSON.stringify(roundPlayer)}`);
          const playerTotal = playerTotals.find(p => p.playerId === roundPlayer.friend_id);
          
          if (playerTotal) {
            console.log(`Found player total for ${roundPlayer.friend_id}: ${JSON.stringify(playerTotal)}`);
            
            // Always include both total_score and net_score in the update
            const updateData = { 
              total_score: playerTotal.totalScore,
              net_score: playerTotal.netScore,
              updated_at: new Date().toISOString()
            };
            
            console.log(`Updating round player ${roundPlayer.id} with data: ${JSON.stringify(updateData)}`);
            const { error: updatePlayerError } = await supabase
              .from('round_players')
              .update(updateData)
              .eq('id', roundPlayer.id);
            
            if (updatePlayerError) {
              console.error(`Error updating round player ${roundPlayer.id}:`, updatePlayerError);
              throw updatePlayerError;
            } else {
              console.log(`Successfully updated round player ${roundPlayer.id}`);
            }
          } else {
            console.log(`No player total found for round player ${roundPlayer.friend_id}`);
            
            // Special handling for the user's round player if no scores were found
            if (roundPlayer.friend_id === userFriendId) {
              console.log('This is the user round player, checking for scores with user ID...');
              
              // Get scores for the user using the user ID
              const userScores = round.scores.filter(score => score.playerId === round.userId);
              console.log(`Found ${userScores.length} scores for user with ID ${round.userId}`);
              
              if (userScores.length > 0) {
                const userTotalScore = userScores.reduce((sum, score) => sum + score.strokes, 0);
                
                // Find the user's player entry to get the selected tee
                const userPlayer = round.players.find(p => p.id === userFriendId || p.id === round.userId);
                
                // Calculate course handicap
                let userCourseHandicap = 0;
                if (userPlayer && userPlayer.handicapIndex !== undefined && userPlayer.selectedTee) {
                  const slope = userPlayer.selectedTee.slope || 113;
                  const rating = userPlayer.selectedTee.rating || 72;
                  // Get par from course holes if available, otherwise default to 72
                  const par = round.course?.holes?.reduce((total, hole) => total + (hole.par || 4), 0) || 72;
                  
                  userCourseHandicap = Math.round((userPlayer.handicapIndex * slope / 113) + (rating - par));
                } else if (roundPlayer.handicap_at_time !== null) {
                  // Fallback to using handicap_at_time if we can find the tee information
                  const teeData = await supabase
                    .from('tee_sets')
                    .select('*')
                    .eq('id', roundPlayer.tee_set_id)
                    .single();
                  
                  if (!teeData.error && teeData.data) {
                    const slope = teeData.data.slope_rating || 113;
                    const rating = teeData.data.course_rating || 72;
                    // Get par from course holes if available, otherwise default to 72
                    const par = round.course?.holes?.reduce((total, hole) => total + (hole.par || 4), 0) || 72;
                    
                    userCourseHandicap = Math.round((roundPlayer.handicap_at_time * slope / 113) + (rating - par));
                  }
                }
                
                // Calculate net score
                const userNetScore = Math.max(0, userTotalScore - userCourseHandicap);
                
                console.log(`User total score: ${userTotalScore}, Course Handicap: ${userCourseHandicap}, Net score: ${userNetScore}`);
                
                // Always include both total_score and net_score in the update
                const updateData = { 
                  total_score: userTotalScore,
                  net_score: userNetScore,
                  updated_at: new Date().toISOString()
                };
                
                console.log(`Updating user round player ${roundPlayer.id} with data: ${JSON.stringify(updateData)}`);
                const { error: updateUserError } = await supabase
                  .from('round_players')
                  .update(updateData)
                  .eq('id', roundPlayer.id);
                
                if (updateUserError) {
                  console.error(`Error updating user round player ${roundPlayer.id}:`, updateUserError);
                  throw updateUserError;
                } else {
                  console.log(`Successfully updated user round player ${roundPlayer.id}`);
                }
              }
            }
          }
        }
        
        // 3. Update last_played_date for the course
        const { error: courseError } = await supabase
          .from('user_courses')
          .upsert({
            user_id: round.userId,
            course_id: round.courseId,
            last_played_date: new Date().toISOString().split('T')[0]
          }, {
            onConflict: 'user_id,course_id'
          });
        
        if (courseError) throw courseError;
        
        // 4. Update last_played_date for friends
        for (const player of round.players) {
          const { error: friendError } = await supabase
            .from('friends')
            .update({ 
              last_played_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', player.id);
          
          if (friendError) throw friendError;
        }
        
        return {
          ...round,
          isCompleted: true
        };
      });
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const startNewRoundThunk = createAsyncThunk(
  'round/startNewRound',
  async (roundData: {
    course: Course;
    players: PlayerWithTee[];
    holeSelection: HoleSelection;
    customStartHole?: number;
    userId: string;
  }, { rejectWithValue }) => {
    try {
      const { course, players, holeSelection, customStartHole, userId } = roundData;
      
      // Ensure course has holes data
      if (!course.holes || course.holes.length === 0) {
        console.error('Course has no holes data:', course);
        return rejectWithValue('Selected course has no holes data. Please select a different course.');
      }
      
      // Determine end hole based on selection
      let customEndHole;
      if (holeSelection === 'custom' && customStartHole) {
        customEndHole = customStartHole + 17 > 18 ? customStartHole + 17 - 18 : customStartHole + 17;
      }
      
      const newRound = {
        id: `temp-${Date.now()}`, // Temporary ID until saved to database
        userId,
        courseId: course.id,
        course,
        date: new Date().toISOString(),
        players,
        holeSelection,
        customStartHole,
        customEndHole,
        scores: [],
        isCompleted: false,
      };
      
      // Calculate net scores and handicap information
      const roundWithNetScores = updateRoundWithNetScores(newRound);

      return roundWithNetScores;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateScoreThunk = createAsyncThunk(
  'round/updateScore',
  async (scoreData: {
    roundId: string;
    playerId: string;
    holeNumber: number;
    strokes: number;
    putts?: number;
    fairwayHit?: boolean;
    greenInRegulation?: boolean;
    penalties?: number;
  }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { round: RoundState };
      const round = state.round.currentRound;
      
      if (!round) {
        return rejectWithValue('No current round found');
      }

      // Get the updated round
      const { data: updatedRound } = await supabase
        .from('rounds')
        .select('*, course:courses(*), players:round_players(*, tee:tee_sets(*))')
        .eq('id', scoreData.roundId)
        .single();

      if (!updatedRound) {
        return rejectWithValue('Failed to fetch updated round');
      }

      // Format the round data
      const formattedRound = formatRoundData(updatedRound);

      // Calculate net scores and handicap information
      const roundWithNetScores = updateRoundWithNetScores(formattedRound);

      return roundWithNetScores;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return rejectWithValue(errorMessage);
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
      
      // Ensure course has holes data
      if (!course.holes || course.holes.length === 0) {
        console.error('Course has no holes data:', course);
        state.error = 'Selected course has no holes data. Please select a different course.';
        return;
      }
      
      // Determine end hole based on selection
      let customEndHole;
      if (holeSelection === 'custom' && customStartHole) {
        customEndHole = customStartHole + 17 > 18 ? customStartHole + 17 - 18 : customStartHole + 17;
      }
      
      state.currentRound = {
        id: `temp-${Date.now()}`, // Temporary ID until saved to database
        userId,
        courseId: course.id,
        course,
        date: new Date().toISOString(),
        players,
        holeSelection,
        customStartHole,
        customEndHole,
        scores: [],
        isCompleted: false,
      };
      
      // Clear any previous errors
      state.error = null;
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
      })
      // Start New Round Thunk
      .addCase(startNewRoundThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startNewRoundThunk.fulfilled, (state, action: PayloadAction<Round>) => {
        state.isLoading = false;
        state.currentRound = action.payload;
      })
      .addCase(startNewRoundThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Score Thunk
      .addCase(updateScoreThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateScoreThunk.fulfilled, (state, action: PayloadAction<Round>) => {
        state.isLoading = false;
        state.currentRound = action.payload;
      })
      .addCase(updateScoreThunk.rejected, (state, action) => {
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