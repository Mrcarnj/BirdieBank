import { HoleScore } from '../../store/slices/roundSlice';
import { GameResult } from '../../store/slices/gameSlice';

interface NinesDetails {
  totalPoints: number;
  holeResults: Record<number, {
    points: number;
    position: 'low' | 'middle' | 'high' | 'tied';
  }>;
}

export const calculateNinesScore = (
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
      totalPoints: 0,
      holeResults: {}
    } as NinesDetails
  }));
  
  // Nines requires exactly 3 players
  if (players.length !== 3) {
    return results;
  }
  
  // Group scores by hole
  const holeScores: { [hole: number]: HoleScore[] } = {};
  scores.forEach(score => {
    if (!holeScores[score.holeNumber]) {
      holeScores[score.holeNumber] = [];
    }
    holeScores[score.holeNumber].push(score);
  });
  
  // Get played holes and sort them
  const playedHoles = Object.keys(holeScores).map(Number).sort((a, b) => a - b);
  
  // Get point value
  const pointValue = settings.pointValue || 1;
  
  // Process each hole
  playedHoles.forEach(hole => {
    const holeScoreList = holeScores[hole];
    
    // Skip holes with incomplete data
    if (holeScoreList.length < 3) {
      return;
    }
    
    // Get scores for this hole
    const holePlayerScores: { playerId: string; strokes: number }[] = holeScoreList.map(score => ({
      playerId: score.playerId,
      strokes: score.strokes
    }));
    
    // Sort scores from lowest to highest
    holePlayerScores.sort((a, b) => a.strokes - b.strokes);
    
    // Determine point distribution based on the rules
    let pointDistribution: { [playerId: string]: { points: number; position: 'low' | 'middle' | 'high' | 'tied' } } = {};
    
    if (holePlayerScores[0].strokes === holePlayerScores[1].strokes && holePlayerScores[1].strokes === holePlayerScores[2].strokes) {
      // All three players tie
      holePlayerScores.forEach(score => {
        pointDistribution[score.playerId] = { points: 3, position: 'tied' };
      });
    } else if (holePlayerScores[0].strokes === holePlayerScores[1].strokes) {
      // Two players tie for low score
      pointDistribution[holePlayerScores[0].playerId] = { points: 4, position: 'low' };
      pointDistribution[holePlayerScores[1].playerId] = { points: 4, position: 'low' };
      pointDistribution[holePlayerScores[2].playerId] = { points: 1, position: 'high' };
    } else if (holePlayerScores[1].strokes === holePlayerScores[2].strokes) {
      // Two players tie for high score
      pointDistribution[holePlayerScores[0].playerId] = { points: 5, position: 'low' };
      pointDistribution[holePlayerScores[1].playerId] = { points: 2, position: 'high' };
      pointDistribution[holePlayerScores[2].playerId] = { points: 2, position: 'high' };
    } else {
      // No ties
      pointDistribution[holePlayerScores[0].playerId] = { points: 5, position: 'low' };
      pointDistribution[holePlayerScores[1].playerId] = { points: 3, position: 'middle' };
      pointDistribution[holePlayerScores[2].playerId] = { points: 1, position: 'high' };
    }
    
    // Update results for each player
    results.forEach(result => {
      if (!result.details) return;
      
      const playerPoints = pointDistribution[result.playerId];
      if (playerPoints) {
        (result.details as NinesDetails).totalPoints += playerPoints.points;
        (result.details as NinesDetails).holeResults[hole] = playerPoints;
        result.points += playerPoints.points;
      }
    });
  });
  
  // Calculate final amounts
  // The player with the most points wins, losers pay based on point differential
  const totalPoints = results.reduce((sum, result) => sum + result.points, 0);
  const pointsPerPlayer = totalPoints / players.length;
  
  results.forEach(result => {
    // Calculate amount based on points above/below average
    const pointDifferential = result.points - pointsPerPlayer;
    result.amount = pointDifferential * pointValue;
  });
  
  return results;
}; 