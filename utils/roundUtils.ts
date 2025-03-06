import { Round, HoleScore } from '../store/slices/roundSlice';
import { 
  calculateNetScores, 
  getPlayingHandicaps, 
  getCourseHandicaps,
  getStrokesReceivedOnHole
} from './handicapUtils';

/**
 * Format round data from Supabase to match our Round interface
 */
export const formatRoundData = (roundData: any): Round => {
  // Format players
  const players = roundData.players.map((player: any) => ({
    id: player.friend_id,
    name: player.friends?.name || 'Unknown',
    handicapIndex: player.handicap_at_time,
    profileImageUrl: player.friends?.profile_image_url,
    isGuest: player.friends?.is_guest || false,
    selectedTee: player.tee ? {
      id: player.tee.id,
      name: player.tee.name,
      color: player.tee.color,
      rating: player.tee.course_rating,
      slope: player.tee.slope_rating
    } : undefined
  }));
  
  // Format scores
  const scores: HoleScore[] = [];
  
  // Fetch scores for each player
  roundData.players.forEach((player: any) => {
    if (player.scores) {
      player.scores.forEach((score: any) => {
        scores.push({
          playerId: player.friend_id,
          holeNumber: score.hole_number,
          strokes: score.strokes,
          putts: score.putts,
          fairwayHit: score.fairway_hit,
          greenInRegulation: score.green_in_regulation,
          penalties: score.penalties
        });
      });
    }
  });
  
  // Format course
  const course = roundData.course ? {
    id: roundData.course.id,
    name: roundData.course.name,
    city: roundData.course.city,
    state: roundData.course.state,
    country: roundData.course.country,
    holes: roundData.course.holes || [],
    tee_sets: roundData.course.tee_sets || [],
    par: roundData.course.par
  } : undefined;
  
  // Format round
  const round: Round = {
    id: roundData.id,
    userId: roundData.user_id,
    courseId: roundData.course_id,
    course,
    date: roundData.date,
    players,
    holeSelection: roundData.hole_selection,
    customStartHole: roundData.custom_start_hole,
    customEndHole: roundData.custom_end_hole,
    scores,
    isCompleted: roundData.is_completed,
    weather: {
      temperature: roundData.weather_temperature,
      conditions: roundData.weather_conditions,
      windSpeed: roundData.weather_wind_speed
    },
    notes: roundData.notes
  };
  
  return round;
};

/**
 * Calculate and update net scores for a round
 * This function modifies the round object in place
 */
export const updateRoundWithNetScores = (round: Round): Round => {
  if (!round.course || !round.course.holes) {
    return round;
  }
  
  // Create a map of hole numbers to stroke indexes
  const strokeIndexes: Record<number, number> = {};
  round.course.holes.forEach(hole => {
    strokeIndexes[hole.number] = hole.strokeIndex || 0;
  });
  
  // Get course par
  const coursePar = round.course.par || 72;
  
  // Calculate net scores
  const netScoresMap = calculateNetScores(round.scores, round.players, strokeIndexes);
  
  // Get playing handicaps
  const playingHandicaps = getPlayingHandicaps(round.players);
  
  // Get course handicaps
  const courseHandicaps = getCourseHandicaps(round.players);
  
  // Calculate strokes received for each player on each hole
  const strokesReceived: Record<string, Record<number, number>> = {};
  
  round.players.forEach(player => {
    strokesReceived[player.id] = {};
    
    // Get all hole numbers from the scores
    const holeNumbers = [...new Set(round.scores.map(score => score.holeNumber))];
    
    holeNumbers.forEach(holeNumber => {
      const strokeIndex = strokeIndexes[holeNumber] || 0;
      strokesReceived[player.id][holeNumber] = getStrokesReceivedOnHole(
        playingHandicaps[player.id] || 0,
        strokeIndex
      );
    });
  });
  
  // Create net score objects
  const netScores: HoleScore[] = [];
  
  round.scores.forEach(score => {
    if (
      netScoresMap[score.playerId] && 
      netScoresMap[score.playerId][score.holeNumber] !== undefined
    ) {
      netScores.push({
        ...score,
        strokes: netScoresMap[score.playerId][score.holeNumber],
        isNetScore: true
      });
    }
  });
  
  // Update the round object
  round.netScores = netScores;
  round.playingHandicaps = playingHandicaps;
  round.courseHandicaps = courseHandicaps;
  round.strokesReceived = strokesReceived;
  
  return round;
};

/**
 * Get the gross score for a player on a specific hole
 */
export const getGrossScore = (
  round: Round,
  playerId: string,
  holeNumber: number
): number | undefined => {
  const score = round.scores.find(
    s => s.playerId === playerId && s.holeNumber === holeNumber
  );
  
  return score?.strokes;
};

/**
 * Get the net score for a player on a specific hole
 */
export const getNetScore = (
  round: Round,
  playerId: string,
  holeNumber: number
): number | undefined => {
  if (!round.netScores) {
    return undefined;
  }
  
  const score = round.netScores.find(
    s => s.playerId === playerId && s.holeNumber === holeNumber
  );
  
  return score?.strokes;
};

/**
 * Get the strokes received for a player on a specific hole
 */
export const getStrokesReceived = (
  round: Round,
  playerId: string,
  holeNumber: number
): number => {
  if (!round.strokesReceived || !round.strokesReceived[playerId]) {
    return 0;
  }
  
  return round.strokesReceived[playerId][holeNumber] || 0;
};

/**
 * Check if a player receives a stroke on a specific hole
 */
export const receivesStrokeOnHole = (
  round: Round,
  playerId: string,
  holeNumber: number
): boolean => {
  return getStrokesReceived(round, playerId, holeNumber) > 0;
};

/**
 * Get the course handicap for a player
 */
export const getCourseHandicap = (
  round: Round,
  playerId: string
): number => {
  if (!round.courseHandicaps) {
    return 0;
  }
  
  return round.courseHandicaps[playerId] || 0;
};

/**
 * Get the playing handicap for a player
 */
export const getPlayingHandicap = (
  round: Round,
  playerId: string
): number => {
  if (!round.playingHandicaps) {
    return 0;
  }
  
  return round.playingHandicaps[playerId] || 0;
}; 