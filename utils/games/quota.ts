import { HoleScore } from '../../store/slices/roundSlice';
import { GameResult } from '../../store/slices/gameSlice';

interface QuotaDetails {
  quota: number;
  pointsEarned: number;
  pointsOverQuota: number;
  holeResults: Record<number, {
    points: number;
    runningTotal: number;
  }>;
}

export const calculateQuotaScore = (
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
      quota: 0,
      pointsEarned: 0,
      pointsOverQuota: 0,
      holeResults: {}
    } as QuotaDetails
  }));
  
  // Quota requires at least 2 players
  if (players.length < 2) {
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
  
  // Get stake amount
  const stake = settings.stake || 1;
  
  // Set quotas for each player
  // Common formula: 36 minus handicap = quota
  results.forEach(result => {
    const playerSettings = settings.playerSettings?.[result.playerId] || {};
    const handicap = playerSettings.handicap || 0;
    
    // Use custom quota if provided, otherwise calculate based on handicap
    const quota = playerSettings.quota !== undefined 
      ? playerSettings.quota 
      : 36 - handicap;
    
    if (result.details) {
      (result.details as QuotaDetails).quota = quota;
    }
  });
  
  // Process each hole
  playedHoles.forEach(hole => {
    const holeScoreList = holeScores[hole];
    const holePar = settings.holePars?.[hole] || 4; // Default to par 4 if not specified
    
    // Calculate points for each player using Stableford system
    holeScoreList.forEach(score => {
      const playerId = score.playerId;
      const strokes = score.strokes;
      const playerResult = results.find(r => r.playerId === playerId);
      
      if (!playerResult || !playerResult.details) return;
      
      // Calculate points using Stableford system
      let points = 0;
      const scoreToPar = strokes - holePar;
      
      if (scoreToPar <= -3) {
        // Double eagle or better
        points = 8;
      } else if (scoreToPar === -2) {
        // Eagle
        points = 5;
      } else if (scoreToPar === -1) {
        // Birdie
        points = 2;
      } else if (scoreToPar === 0) {
        // Par
        points = 1;
      } else if (scoreToPar === 1) {
        // Bogey
        points = 0;
      } else {
        // Double bogey or worse
        points = 0;
      }
      
      // Update player's points
      (playerResult.details as QuotaDetails).pointsEarned += points;
      
      // Record hole result
      (playerResult.details as QuotaDetails).holeResults[hole] = {
        points: points,
        runningTotal: (playerResult.details as QuotaDetails).pointsEarned
      };
    });
  });
  
  // Calculate points over/under quota
  results.forEach(result => {
    if (!result.details) return;
    
    const quota = (result.details as QuotaDetails).quota;
    const pointsEarned = (result.details as QuotaDetails).pointsEarned;
    const pointsOverQuota = pointsEarned - quota;
    
    (result.details as QuotaDetails).pointsOverQuota = pointsOverQuota;
    result.points = pointsOverQuota;
  });
  
  // Determine winner(s) - player(s) who exceeded their quota by the most
  const maxPointsOverQuota = Math.max(...results.map(r => r.points));
  const winners = results.filter(r => r.points === maxPointsOverQuota);
  
  // Calculate payouts
  if (winners.length > 0 && maxPointsOverQuota > 0) {
    // Winners split the pot
    const losers = results.filter(r => r.points < maxPointsOverQuota);
    const totalLoss = losers.length * stake;
    const winPerPlayer = totalLoss / winners.length;
    
    winners.forEach(winner => {
      winner.amount = winPerPlayer;
    });
    
    losers.forEach(loser => {
      loser.amount = -stake;
    });
  } else {
    // No winner or tie, no money changes hands
    results.forEach(result => {
      result.amount = 0;
    });
  }
  
  return results;
}; 