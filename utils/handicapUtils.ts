import { HoleScore } from '../store/slices/roundSlice';
import { PlayerWithTee } from '../store/slices/playerSlice';

/**
 * Calculate the course handicap for a player
 * Formula: Course Handicap = Handicap Index × (Slope Rating ÷ 113) + (Course Rating - Par)
 */
export const calculateCourseHandicap = (
  handicapIndex: number | undefined,
  slopeRating: number | undefined,
  courseRating: number | undefined,
  par: number | undefined
): number => {
  if (
    handicapIndex === undefined ||
    slopeRating === undefined ||
    courseRating === undefined ||
    par === undefined
  ) {
    return 0;
  }

  const courseHandicap = handicapIndex * (slopeRating / 113) + (courseRating - par);
  return Math.round(courseHandicap);
};

/**
 * Format a course handicap with proper golf notation (+ for plus handicaps)
 */
export const formatCourseHandicap = (handicap: number): string => {
  if (handicap < 0) {
    return `+${Math.abs(handicap)}`;
  }
  return handicap.toString();
};

/**
 * Calculate the playing handicap for a player in a competition
 * This is the number of strokes a player receives in a competition
 * based on the lowest handicap player in the group
 */
export const calculatePlayingHandicap = (
  playerCourseHandicap: number,
  lowestCourseHandicap: number
): number => {
  return Math.max(0, playerCourseHandicap - lowestCourseHandicap);
};

/**
 * Determine if a player receives a stroke on a specific hole
 * based on their playing handicap and the hole's stroke index
 */
export const getStrokesReceivedOnHole = (
  playingHandicap: number,
  strokeIndex: number
): number => {
  if (playingHandicap <= 0) return 0;
  
  // Calculate how many complete cycles through the stroke index
  const fullCycles = Math.floor((playingHandicap - 1) / 18);
  
  // Calculate the remaining strokes after full cycles
  const remainingStrokes = playingHandicap - (fullCycles * 18);
  
  // Player gets a stroke if the hole's stroke index is less than or equal to remaining strokes
  const baseStrokes = strokeIndex <= remainingStrokes ? 1 : 0;
  
  // Add strokes for full cycles
  return baseStrokes + fullCycles;
};

/**
 * Calculate the net score for a hole
 */
export const calculateNetScore = (
  grossScore: number,
  strokesReceived: number
): number => {
  return grossScore - strokesReceived;
};

/**
 * Calculate the net scores for all players on all holes
 * Returns a map of player IDs to a map of hole numbers to net scores
 */
export const calculateNetScores = (
  scores: HoleScore[],
  players: PlayerWithTee[],
  strokeIndexes: Record<number, number>
): Record<string, Record<number, number>> => {
  // Calculate course handicaps for all players
  const courseHandicaps: Record<string, number> = {};
  players.forEach(player => {
    const handicapIndex = player.handicapIndex || 0;
    const slopeRating = player.selectedTee?.slope || 113;
    const courseRating = player.selectedTee?.rating || 72;
    const par = 72; // Default par, should be provided by the course
    
    courseHandicaps[player.id] = calculateCourseHandicap(
      handicapIndex,
      slopeRating,
      courseRating,
      par
    );
  });
  
  // Find the lowest course handicap
  const lowestCourseHandicap = Math.min(...Object.values(courseHandicaps));
  
  // Calculate playing handicaps for all players
  const playingHandicaps: Record<string, number> = {};
  players.forEach(player => {
    playingHandicaps[player.id] = calculatePlayingHandicap(
      courseHandicaps[player.id],
      lowestCourseHandicap
    );
  });
  
  // Calculate net scores for all players on all holes
  const netScores: Record<string, Record<number, number>> = {};
  
  // Initialize net scores object
  players.forEach(player => {
    netScores[player.id] = {};
  });
  
  // Calculate net scores for each hole
  scores.forEach(score => {
    const playerId = score.playerId;
    const holeNumber = score.holeNumber;
    const grossScore = score.strokes;
    
    // Get the stroke index for this hole
    const strokeIndex = strokeIndexes[holeNumber] || 0;
    
    // Calculate strokes received on this hole
    const strokesReceived = getStrokesReceivedOnHole(
      playingHandicaps[playerId] || 0,
      strokeIndex
    );
    
    // Calculate net score
    const netScore = calculateNetScore(grossScore, strokesReceived);
    
    // Store net score
    if (!netScores[playerId]) {
      netScores[playerId] = {};
    }
    netScores[playerId][holeNumber] = netScore;
  });
  
  return netScores;
};

/**
 * Determine if a player receives a stroke on a specific hole
 * Returns true if the player receives one or more strokes on the hole
 */
export const receivesStrokeOnHole = (
  playingHandicap: number,
  strokeIndex: number
): boolean => {
  return getStrokesReceivedOnHole(playingHandicap, strokeIndex) > 0;
};

/**
 * Get the playing handicaps for all players in a group
 * Returns a map of player IDs to playing handicaps
 */
export const getPlayingHandicaps = (
  players: PlayerWithTee[]
): Record<string, number> => {
  // Calculate course handicaps for all players
  const courseHandicaps: Record<string, number> = {};
  players.forEach(player => {
    const handicapIndex = player.handicapIndex || 0;
    const slopeRating = player.selectedTee?.slope || 113;
    const courseRating = player.selectedTee?.rating || 72;
    const par = 72; // Default par, should be provided by the course
    
    courseHandicaps[player.id] = calculateCourseHandicap(
      handicapIndex,
      slopeRating,
      courseRating,
      par
    );
  });
  
  // Find the lowest course handicap
  const lowestCourseHandicap = Math.min(...Object.values(courseHandicaps));
  
  // Calculate playing handicaps for all players
  const playingHandicaps: Record<string, number> = {};
  players.forEach(player => {
    playingHandicaps[player.id] = calculatePlayingHandicap(
      courseHandicaps[player.id],
      lowestCourseHandicap
    );
  });
  
  return playingHandicaps;
};

/**
 * Get the course handicaps for all players in a group
 * Returns a map of player IDs to course handicaps
 */
export const getCourseHandicaps = (
  players: PlayerWithTee[]
): Record<string, number> => {
  // Calculate course handicaps for all players
  const courseHandicaps: Record<string, number> = {};
  players.forEach(player => {
    const handicapIndex = player.handicapIndex || 0;
    const slopeRating = player.selectedTee?.slope || 113;
    const courseRating = player.selectedTee?.rating || 72;
    const par = 72; // Default par, should be provided by the course
    
    courseHandicaps[player.id] = calculateCourseHandicap(
      handicapIndex,
      slopeRating,
      courseRating,
      par
    );
  });
  
  return courseHandicaps;
}; 