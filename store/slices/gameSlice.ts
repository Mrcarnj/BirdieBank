import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PlayerWithTee } from './playerSlice';
import { HoleScore } from './roundSlice';
import { calculateGameResults } from '../../utils/games';

export type GameType = 'nassau' | 'skins' | 'match-play' | 'stableford' | 'vegas' | 'wolf';

export interface GameResult {
  playerId: string;
  points: number;
  amount: number;
  details: Record<string, any>; // Game-specific details
}

export interface Game {
  id: string;
  type: GameType;
  players: string[]; // Player IDs
  stake: number;
  results: GameResult[];
  settings?: Record<string, any>; // Game-specific settings
}

// Helper functions for game scoring
export const calculateNassauScore = (
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
      frontNine: 0,
      backNine: 0,
      total: 0,
      presses: []
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
  
  // Calculate front nine, back nine, and total scores
  let frontNineWinner = '';
  let backNineWinner = '';
  let totalWinner = '';
  
  // Calculate front nine
  const frontNineScores: { [playerId: string]: number } = {};
  for (let hole = 1; hole <= 9; hole++) {
    if (holeScores[hole]) {
      holeScores[hole].forEach(score => {
        frontNineScores[score.playerId] = (frontNineScores[score.playerId] || 0) + score.strokes;
      });
    }
  }
  
  // Calculate back nine
  const backNineScores: { [playerId: string]: number } = {};
  for (let hole = 10; hole <= 18; hole++) {
    if (holeScores[hole]) {
      holeScores[hole].forEach(score => {
        backNineScores[score.playerId] = (backNineScores[score.playerId] || 0) + score.strokes;
      });
    }
  }
  
  // Calculate total scores
  const totalScores: { [playerId: string]: number } = {};
  players.forEach(playerId => {
    totalScores[playerId] = (frontNineScores[playerId] || 0) + (backNineScores[playerId] || 0);
  });
  
  // Determine winners
  if (Object.keys(frontNineScores).length > 0) {
    frontNineWinner = players.reduce((winner, playerId) => {
      if (!winner) return playerId;
      return (frontNineScores[playerId] || Infinity) < (frontNineScores[winner] || Infinity) ? playerId : winner;
    }, '');
  }
  
  if (Object.keys(backNineScores).length > 0) {
    backNineWinner = players.reduce((winner, playerId) => {
      if (!winner) return playerId;
      return (backNineScores[playerId] || Infinity) < (backNineScores[winner] || Infinity) ? playerId : winner;
    }, '');
  }
  
  if (Object.keys(totalScores).length > 0) {
    totalWinner = players.reduce((winner, playerId) => {
      if (!winner) return playerId;
      return (totalScores[playerId] || Infinity) < (totalScores[winner] || Infinity) ? playerId : winner;
    }, '');
  }
  
  // Calculate points and amounts
  results.forEach(result => {
    let points = 0;
    let amount = 0;
    
    if (result.playerId === frontNineWinner) {
      points += 1;
      amount += settings.frontNineStake || 1;
      result.details.frontNine = 1;
    } else if (frontNineWinner) {
      result.details.frontNine = -1;
    }
    
    if (result.playerId === backNineWinner) {
      points += 1;
      amount += settings.backNineStake || 1;
      result.details.backNine = 1;
    } else if (backNineWinner) {
      result.details.backNine = -1;
    }
    
    if (result.playerId === totalWinner) {
      points += 1;
      amount += settings.overallStake || 1;
      result.details.total = 1;
    } else if (totalWinner) {
      result.details.total = -1;
    }
    
    result.points = points;
    result.amount = amount;
  });
  
  // Handle presses if enabled
  if (settings.pressType && settings.pressType !== 'none' && settings.pressStake) {
    // Add press details to each player's results
    results.forEach(result => {
      if (settings.pressType === 'anytime') {
        // For anytime presses, we need to track when players are 2 down
        // This would require additional game state tracking
        // For now, we'll just note that presses are enabled
        result.details.presses = [{ type: 'anytime', stake: settings.pressStake }];
      } else if (settings.pressType === 'auto') {
        // For auto presses, we need to track when players are 2 down
        // This would require additional game state tracking
        // For now, we'll just note that presses are enabled
        result.details.presses = [{ type: 'auto', stake: settings.pressStake }];
      }
    });
  }
  
  return results;
};

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
      albatross: 5, // 3 under par
      eagle: 4,     // 2 under par
      birdie: 3,    // 1 under par
      par: 2,       // Even par
      bogey: 1,     // 1 over par
      doubleBogey: 0 // 2+ over par
    } : 
    { // Traditional Stableford
      albatross: 5, // 3 under par
      eagle: 4,     // 2 under par
      birdie: 3,    // 1 under par
      par: 2,       // Even par
      bogey: 0,     // 1 over par
      doubleBogey: -1 // 2+ over par
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
      points = scoringSystem.albatross;
    } else if (relativeScore === -2) {
      points = scoringSystem.eagle;
    } else if (relativeScore === -1) {
      points = scoringSystem.birdie;
    } else if (relativeScore === 0) {
      points = scoringSystem.par;
    } else if (relativeScore === 1) {
      points = scoringSystem.bogey;
    } else {
      points = scoringSystem.doubleBogey;
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

interface GameState {
  availableGames: {
    type: GameType;
    name: string;
    description: string;
  }[];
  selectedGames: Game[];
  isLoading: boolean;
  error: string | null;
}

const initialState: GameState = {
  availableGames: [
    {
      type: 'nassau',
      name: 'Nassau',
      description: 'Front 9, Back 9, and Total 18 bets',
    },
    {
      type: 'skins',
      name: 'Skins',
      description: 'Win a hole outright to win a skin',
    },
    {
      type: 'match-play',
      name: 'Match Play',
      description: 'Play hole by hole against opponents',
    },
    {
      type: 'stableford',
      name: 'Stableford',
      description: 'Points based on score relative to par',
    },
    {
      type: 'vegas',
      name: 'Vegas',
      description: 'Team game with special scoring',
    },
    {
      type: 'wolf',
      name: 'Wolf',
      description: 'Players take turns being the "Wolf"',
    },
  ],
  selectedGames: [],
  isLoading: false,
  error: null,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    selectGame: (state, action: PayloadAction<{
      type: GameType;
      players: PlayerWithTee[];
      stake: number;
      settings?: Record<string, any>;
    }>) => {
      const { type, players, stake, settings } = action.payload;
      
      const game: Game = {
        id: `game-${Date.now()}-${type}`,
        type,
        players: players.map(p => p.id),
        stake,
        results: players.map(p => ({
          playerId: p.id,
          points: 0,
          amount: 0,
          details: {} // Initialize empty details object
        })),
        settings,
      };
      
      state.selectedGames.push(game);
    },
    removeGame: (state, action: PayloadAction<string>) => {
      state.selectedGames = state.selectedGames.filter(game => game.id !== action.payload);
    },
    updateGameResults: (state, action: PayloadAction<{
      scores: HoleScore[];
      roundId: string;
    }>) => {
      const { scores } = action.payload;
      
      // Update results for each game
      state.selectedGames.forEach(game => {
        game.results = calculateGameResults(game.type, scores, game.players, game.settings || {});
      });
    },
    clearSelectedGames: (state) => {
      state.selectedGames = [];
    },
  },
});

export const { selectGame, removeGame, updateGameResults, clearSelectedGames } = gameSlice.actions;

export default gameSlice.reducer; 