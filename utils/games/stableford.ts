import { HoleScore } from '../../store/slices/roundSlice';
import { GameResult } from '../../store/slices/gameSlice';

export const calculateStablefordScore = (
  scores: HoleScore[], 
  players: string[], 
  settings: Record<string, any>
): GameResult[] => {
  // Initialize results
  const results: GameResult[] = players.map(playerId => ({
    playerId,
    points: 0,
    amount: 0,
    details: {
      holePoints: {}
    }
  }));
  
  // Define scoring system
  const scoringSystem = settings.modifiedScoring ? 
    { // Modified Stableford
      3: 5, // Albatross (3 under par)
      2: 4, // Eagle (2 under par)
      1: 3, // Birdie (1 under par)
      0: 2, // Par
      1: 1, // Bogey (1 over par)
      2: 0  // Double Bogey or worse (2+ over par)
    } : 
    { // Traditional Stableford
      3: 5, // Albatross (3 under par)
      2: 4, // Eagle (2 under par)
      1: 3, // Birdie (1 under par)
      0: 2, // Par
      1: 0, // Bogey (1 over par)
      2: -1 // Double Bogey (2 over par)
    };
  
  // Calculate points for each hole
  scores.forEach(score => {
    // Find the player's result
    const playerResult = results.find(result => result.playerId === score.playerId);
    if (!playerResult) return;
    
    // Get the par for the hole (assuming par 4 if not specified)
    const par = 4; // This should be retrieved from the course data
    
    // Calculate score relative to par
    const relativeScore = score.strokes - par;
    
    // Determine points based on scoring system
    let points = 0;
    if (relativeScore <= -3) {
      points = scoringSystem[3]; // Albatross or better
    } else if (relativeScore === -2) {
      points = scoringSystem[2]; // Eagle
    } else if (relativeScore === -1) {
      points = scoringSystem[1]; // Birdie
    } else if (relativeScore === 0) {
      points = scoringSystem[0]; // Par
    } else if (relativeScore === 1) {
      points = scoringSystem[1]; // Bogey
    } else {
      points = scoringSystem[2]; // Double bogey or worse
    }
    
    // Update player's points
    playerResult.points += points;
    playerResult.details.holePoints[score.holeNumber] = points;
  });
  
  // Calculate amounts based on points
  const highestPoints = Math.max(...results.map(result => result.points));
  const winners = results.filter(result => result.points === highestPoints);
  
  if (winners.length === 1) {
    // Single winner
    const winner = winners[0];
    winner.amount = (settings.stake || 1) * (players.length - 1);
    
    // Deduct from losers
    results.forEach(result => {
      if (result.playerId !== winner.playerId) {
        result.amount = -(settings.stake || 1);
      }
    });
  } else if (winners.length > 1) {
    // Multiple winners (tie)
    const winnerShare = (settings.stake || 1) * (players.length - winners.length) / winners.length;
    
    winners.forEach(winner => {
      winner.amount = winnerShare;
    });
    
    // Deduct from losers
    results.forEach(result => {
      if (!winners.some(winner => winner.playerId === result.playerId)) {
        result.amount = -(settings.stake || 1);
      }
    });
  }
  
  return results;
};
