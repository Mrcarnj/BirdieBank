import { HoleScore } from '../../store/slices/roundSlice';
import { GameResult } from '../../store/slices/gameSlice';

interface VegasDetails {
  holeResults: Record<number, number>;
  teamId: number;
}

export const calculateVegasScore = (
  scores: HoleScore[], 
  players: string[], 
  settings: Record<string, any>
): GameResult[] => {
  // Vegas is a team game with 4 players (2 teams of 2)
  // Initialize results
  const results: GameResult[] = players.map(playerId => ({
    playerId,
    points: 0,
    amount: 0,
    details: {
      holeResults: {} as Record<number, number>,
      teamId: 0
    } as VegasDetails
  }));
  
  // If there are not exactly 4 players, return empty results
  if (players.length !== 4) {
    return results;
  }
  
  // Assign teams based on settings
  const teams = settings.teams || {};
  
  // Default team assignment if not provided (0-1 vs 2-3)
  players.forEach((playerId, index) => {
    const teamId = teams[playerId] !== undefined ? teams[playerId] : Math.floor(index / 2);
    const playerResult = results.find(r => r.playerId === playerId);
    if (playerResult && playerResult.details) {
      (playerResult.details as VegasDetails).teamId = teamId;
    }
  });
  
  // Group players by team
  const teamPlayers: { [teamId: number]: string[] } = {};
  results.forEach(result => {
    if (result.details) {
      const teamId = (result.details as VegasDetails).teamId;
      if (!teamPlayers[teamId]) {
        teamPlayers[teamId] = [];
      }
      teamPlayers[teamId].push(result.playerId);
    }
  });
  
  // Group scores by hole
  const holeScores: { [hole: number]: HoleScore[] } = {};
  scores.forEach(score => {
    if (!holeScores[score.holeNumber]) {
      holeScores[score.holeNumber] = [];
    }
    holeScores[score.holeNumber].push(score);
  });
  
  // Calculate Vegas score for each hole
  const playedHoles = Object.keys(holeScores).map(Number).sort((a, b) => a - b);
  const stake = settings.stake || 1;
  const multiplier = settings.multiplier || 1; // For double/triple payouts on large margins
  
  playedHoles.forEach(hole => {
    const holeScoreList = holeScores[hole];
    
    // Calculate team scores for this hole
    const teamScores: { [teamId: number]: number } = {};
    
    // For each team, calculate the Vegas score (combine digits, not add)
    Object.keys(teamPlayers).forEach(teamIdStr => {
      const teamId = parseInt(teamIdStr);
      const team = teamPlayers[teamId];
      
      // Get individual scores for team members
      const memberScores = team.map(playerId => {
        const playerScore = holeScoreList.find(score => score.playerId === playerId);
        return playerScore ? playerScore.strokes : 0;
      }).filter(score => score > 0);
      
      // Need both team members' scores to calculate Vegas score
      if (memberScores.length === 2) {
        // Sort scores based on settings
        if (settings.highScoreFirst) {
          // Higher score always goes first
          memberScores.sort((a, b) => b - a);
        }
        
        // Combine digits to form Vegas score
        const vegasScore = parseInt(`${memberScores[0]}${memberScores[1]}`);
        teamScores[teamId] = vegasScore;
      }
    });
    
    // If we have scores for both teams, determine the winner
    const teamIds = Object.keys(teamScores).map(Number);
    if (teamIds.length === 2) {
      const team1 = teamIds[0];
      const team2 = teamIds[1];
      
      const team1Score = teamScores[team1];
      const team2Score = teamScores[team2];
      
      // Calculate the difference and payout
      const difference = team1Score - team2Score;
      let payout = Math.abs(difference) * stake;
      
      // Apply multiplier for large margins if enabled
      if (settings.useMultiplier && Math.abs(difference) >= (settings.multiplierThreshold || 10)) {
        payout *= multiplier;
      }
      
      // Assign points and amounts to players
      results.forEach(result => {
        if (result.details) {
          // Store the hole result for this player
          (result.details as VegasDetails).holeResults[hole] = (result.details as VegasDetails).teamId === team1 ? -difference : difference;
          
          if (difference !== 0) {
            if ((result.details as VegasDetails).teamId === team1) {
              // Team 1 players
              if (difference < 0) {
                // Team 1 wins
                result.points += 1;
                result.amount += payout / 2; // Split between 2 team members
              } else {
                // Team 1 loses
                result.points -= 1;
                result.amount -= payout / 2;
              }
            } else {
              // Team 2 players
              if (difference > 0) {
                // Team 2 wins
                result.points += 1;
                result.amount += payout / 2;
              } else {
                // Team 2 loses
                result.points -= 1;
                result.amount -= payout / 2;
              }
            }
          }
        }
      });
    }
  });
  
  return results;
};
