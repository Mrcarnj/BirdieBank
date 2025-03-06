import { HoleScore } from '../../store/slices/roundSlice';
import { GameResult } from '../../store/slices/gameSlice';

interface BingoBangoBongoDetails {
  bingoPoints: number;
  bangoPoints: number;
  bongoPoints: number;
  holeResults: Record<number, {
    bingo?: boolean;
    bango?: boolean;
    bongo?: boolean;
    points: number;
  }>;
}

export const calculateBingoBangoBongoScore = (
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
      bingoPoints: 0,
      bangoPoints: 0,
      bongoPoints: 0,
      holeResults: {}
    } as BingoBangoBongoDetails
  }));
  
  // Bingo Bango Bongo requires at least 2 players
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
  
  // Get point values from settings
  const bingoValue = settings.bingoValue || 1;
  const bangoValue = settings.bangoValue || 1;
  const bongoValue = settings.bongoValue || 1;
  
  // Process each hole
  playedHoles.forEach(hole => {
    const holeScoreList = holeScores[hole];
    
    // Skip holes with incomplete data
    if (holeScoreList.length < players.length) {
      return;
    }
    
    // Initialize hole results for each player
    results.forEach(result => {
      if (result.details) {
        (result.details as BingoBangoBongoDetails).holeResults[hole] = {
          points: 0
        };
      }
    });
    
    // Determine Bingo winner (first on green)
    // In a real implementation, this would use actual "on green" data
    // For this simulation, we'll use the player with the lowest approach shot (strokes - putts)
    let bingoWinner = '';
    let lowestApproach = Infinity;
    
    holeScoreList.forEach(score => {
      // Simulate approach shots by subtracting putts from total strokes
      const approachShots = score.strokes - (score.putts || 0);
      if (approachShots < lowestApproach) {
        lowestApproach = approachShots;
        bingoWinner = score.playerId;
      }
    });
    
    // Award Bingo point
    if (bingoWinner) {
      const bingoResult = results.find(r => r.playerId === bingoWinner);
      if (bingoResult && bingoResult.details) {
        (bingoResult.details as BingoBangoBongoDetails).bingoPoints += 1;
        (bingoResult.details as BingoBangoBongoDetails).holeResults[hole].bingo = true;
        (bingoResult.details as BingoBangoBongoDetails).holeResults[hole].points += 1;
        bingoResult.points += 1;
        bingoResult.amount += bingoValue;
      }
    }
    
    // Determine Bango winner (closest to pin)
    // In a real implementation, this would use actual "closest to pin" data
    // For this simulation, we'll use the player with the fewest putts
    let bangoWinner = '';
    let fewestPutts = Infinity;
    
    holeScoreList.forEach(score => {
      const putts = score.putts || 0;
      if (putts < fewestPutts) {
        fewestPutts = putts;
        bangoWinner = score.playerId;
      }
    });
    
    // Award Bango point
    if (bangoWinner) {
      const bangoResult = results.find(r => r.playerId === bangoWinner);
      if (bangoResult && bangoResult.details) {
        (bangoResult.details as BingoBangoBongoDetails).bangoPoints += 1;
        (bangoResult.details as BingoBangoBongoDetails).holeResults[hole].bango = true;
        (bangoResult.details as BingoBangoBongoDetails).holeResults[hole].points += 1;
        bangoResult.points += 1;
        bangoResult.amount += bangoValue;
      }
    }
    
    // Determine Bongo winner (first to hole out)
    // In a real implementation, this would use actual "order of completion" data
    // For this simulation, we'll use the player with the lowest score
    let bongoWinner = '';
    let lowestScore = Infinity;
    
    holeScoreList.forEach(score => {
      if (score.strokes < lowestScore) {
        lowestScore = score.strokes;
        bongoWinner = score.playerId;
      }
    });
    
    // Award Bongo point
    if (bongoWinner) {
      const bongoResult = results.find(r => r.playerId === bongoWinner);
      if (bongoResult && bongoResult.details) {
        (bongoResult.details as BingoBangoBongoDetails).bongoPoints += 1;
        (bongoResult.details as BingoBangoBongoDetails).holeResults[hole].bongo = true;
        (bongoResult.details as BingoBangoBongoDetails).holeResults[hole].points += 1;
        bongoResult.points += 1;
        bongoResult.amount += bongoValue;
      }
    }
  });
  
  // Calculate final amounts for players who didn't win points
  const totalPoints = results.reduce((sum, result) => sum + result.points, 0);
  const totalAmount = results.reduce((sum, result) => sum + result.amount, 0);
  
  // Distribute losses among players who didn't win points
  const losers = results.filter(result => result.points === 0);
  if (losers.length > 0) {
    const lossPerPlayer = totalAmount / losers.length;
    losers.forEach(loser => {
      loser.amount = -lossPerPlayer;
    });
  }
  
  return results;
}; 