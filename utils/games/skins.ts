import { HoleScore } from '../../store/slices/roundSlice';
import { GameResult } from '../../store/slices/gameSlice';

export const calculateSkinsScore = (
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
      skins: []
    }
  }));
  
  // Group scores by hole
  const holeScores: { [hole: number]: HoleScore[] } = {};
  scores.forEach(score => {
    if (!holeScores[score.holeNumber]) {
      holeScores[score.holeNumber] = [];
    }
    holeScores[score.holeNumber].push(score);
  });
  
  // Calculate skins
  let carryover = 0;
  
  for (let hole = 1; hole <= 18; hole++) {
    if (!holeScores[hole] || holeScores[hole].length < players.length) {
      continue; // Skip holes that don't have scores for all players
    }
    
    // Find the lowest score on the hole
    const lowestScore = Math.min(...holeScores[hole].map(score => score.strokes));
    
    // Count how many players have the lowest score
    const playersWithLowestScore = holeScores[hole].filter(score => score.strokes === lowestScore);
    
    // If only one player has the lowest score, they win a skin
    if (playersWithLowestScore.length === 1) {
      const winner = playersWithLowestScore[0].playerId;
      const skinValue = settings.stake || 1;
      const totalValue = skinValue + carryover;
      
      // Find the winner's result and update it
      const winnerResult = results.find(result => result.playerId === winner);
      if (winnerResult) {
        winnerResult.points += 1;
        winnerResult.amount += totalValue;
        winnerResult.details.skins.push({
          hole,
          value: totalValue,
          strokes: lowestScore
        });
      }
      
      // Reset carryover
      carryover = 0;
    } else if (settings.carryover) {
      // If there's a tie and carryover is enabled, add to the carryover
      carryover += settings.stake || 1;
    }
  }
  
  return results;
};
