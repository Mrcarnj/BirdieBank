import { HoleScore } from '../../store/slices/roundSlice';
import { GameResult } from '../../store/slices/gameSlice';

interface Press {
  id: string;
  type: 'front' | 'back' | 'total';
  parentId?: string;
  startingHole: number;
  endingHole: number;
  initiatedBy: string;
  initiatedAgainst: string;
  initiatedAtHole: number;
  amount: number;
  result: 'win' | 'loss' | 'tie' | 'pending';
}

interface NassauDetails {
  frontNine: number;
  backNine: number;
  total: number;
  presses: Press[];
  holeByHoleStatus?: Record<number, {
    frontNineStatus?: number;
    backNineStatus?: number;
    totalStatus?: number;
    pressesStatus?: Record<string, number>;
  }>;
}

export const calculateNassauScore = (
  scores: HoleScore[], 
  players: string[], 
  settings: Record<string, any>
): GameResult[] => {
  // Nassau is typically played between 2 players or 2 teams
  // If there are not exactly 2 players, return basic results without presses
  const usePressFunctionality = players.length === 2;
  
  // Initialize results
  const results: GameResult[] = players.map(playerId => ({
    playerId,
    points: 0,
    amount: 0,
    details: {
      frontNine: 0,
      backNine: 0,
      total: 0,
      presses: [],
      holeByHoleStatus: {}
    } as NassauDetails
  }));
  
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
  
  // Get press settings
  const usePress = settings.usePress !== undefined ? settings.usePress : false;
  const automaticPress = settings.automaticPress !== undefined ? settings.automaticPress : false;
  const pressAmount = settings.pressAmount || 1;
  const pressTrigger = settings.pressTrigger || 2; // Default to 2-down trigger
  
  // Initialize press tracking
  const presses: Press[] = [];
  
  // Calculate front nine, back nine, and total scores hole by hole
  const frontNineScores: { [playerId: string]: number[] } = {};
  const backNineScores: { [playerId: string]: number[] } = {};
  const totalScores: { [playerId: string]: number[] } = {};
  
  players.forEach(playerId => {
    frontNineScores[playerId] = Array(9).fill(0);
    backNineScores[playerId] = Array(9).fill(0);
    totalScores[playerId] = Array(18).fill(0);
  });
  
  // Process each hole in order
  playedHoles.forEach(hole => {
    const holeScoreList = holeScores[hole];
    
    // Update scores for this hole
    holeScoreList.forEach(score => {
      const playerId = score.playerId;
      const strokes = score.strokes;
      
      // Update front nine scores
      if (hole >= 1 && hole <= 9) {
        const index = hole - 1;
        frontNineScores[playerId][index] = strokes;
      }
      
      // Update back nine scores
      if (hole >= 10 && hole <= 18) {
        const index = hole - 10;
        backNineScores[playerId][index] = strokes;
      }
      
      // Update total scores
      const totalIndex = hole - 1;
      totalScores[playerId][totalIndex] = strokes;
    });
    
    // Skip press logic if not using presses or not enough players
    if (!usePress || !usePressFunctionality) {
      return;
    }
    
    // Check for press conditions after each hole
    if (players.length === 2) {
      const player1 = players[0];
      const player2 = players[1];
      
      // Calculate running scores up to this hole
      const getFrontNineRunningScore = (playerId: string) => {
        return frontNineScores[playerId]
          .slice(0, Math.min(hole, 9))
          .reduce((sum, strokes) => sum + strokes, 0);
      };
      
      const getBackNineRunningScore = (playerId: string) => {
        if (hole < 10) return 0;
        return backNineScores[playerId]
          .slice(0, hole - 9)
          .reduce((sum, strokes) => sum + strokes, 0);
      };
      
      const getTotalRunningScore = (playerId: string) => {
        return totalScores[playerId]
          .slice(0, hole)
          .reduce((sum, strokes) => sum + strokes, 0);
      };
      
      // Calculate differentials
      const frontNineDiff = getFrontNineRunningScore(player1) - getFrontNineRunningScore(player2);
      const backNineDiff = getBackNineRunningScore(player1) - getBackNineRunningScore(player2);
      const totalDiff = getTotalRunningScore(player1) - getTotalRunningScore(player2);
      
      // Update hole-by-hole status
      results.forEach(result => {
        const details = result.details as NassauDetails;
        if (!details.holeByHoleStatus) {
          details.holeByHoleStatus = {};
        }
        
        details.holeByHoleStatus[hole] = {
          frontNineStatus: result.playerId === player1 ? -frontNineDiff : frontNineDiff,
          backNineStatus: result.playerId === player1 ? -backNineDiff : backNineDiff,
          totalStatus: result.playerId === player1 ? -totalDiff : totalDiff,
          pressesStatus: {}
        };
      });
      
      // Check for front nine press
      if (hole >= 1 && hole < 9) {
        const shouldPressForPlayer1 = frontNineDiff >= pressTrigger;
        const shouldPressForPlayer2 = frontNineDiff <= -pressTrigger;
        
        if (automaticPress) {
          // Automatic press for front nine
          if (shouldPressForPlayer1 && !hasPressForSegment(presses, 'front', hole)) {
            createPress(presses, 'front', player2, player1, hole, 9, pressAmount);
          } else if (shouldPressForPlayer2 && !hasPressForSegment(presses, 'front', hole)) {
            createPress(presses, 'front', player1, player2, hole, 9, pressAmount);
          }
        }
      }
      
      // Check for back nine press
      if (hole >= 10 && hole < 18) {
        const shouldPressForPlayer1 = backNineDiff >= pressTrigger;
        const shouldPressForPlayer2 = backNineDiff <= -pressTrigger;
        
        if (automaticPress) {
          // Automatic press for back nine
          if (shouldPressForPlayer1 && !hasPressForSegment(presses, 'back', hole)) {
            createPress(presses, 'back', player2, player1, hole, 18, pressAmount);
          } else if (shouldPressForPlayer2 && !hasPressForSegment(presses, 'back', hole)) {
            createPress(presses, 'back', player1, player2, hole, 18, pressAmount);
          }
        }
      }
      
      // Check for total press
      if (hole >= 1 && hole < 18) {
        const shouldPressForPlayer1 = totalDiff >= pressTrigger;
        const shouldPressForPlayer2 = totalDiff <= -pressTrigger;
        
        if (automaticPress) {
          // Automatic press for total
          if (shouldPressForPlayer1 && !hasPressForSegment(presses, 'total', hole)) {
            createPress(presses, 'total', player2, player1, hole, 18, pressAmount);
          } else if (shouldPressForPlayer2 && !hasPressForSegment(presses, 'total', hole)) {
            createPress(presses, 'total', player1, player2, hole, 18, pressAmount);
          }
        }
      }
      
      // Update press status for each hole
      presses.forEach(press => {
        if (hole >= press.startingHole && hole <= press.endingHole) {
          // Calculate press score for this hole
          let pressScore1 = 0;
          let pressScore2 = 0;
          
          if (press.type === 'front') {
            // Only count holes from press.startingHole to 9
            const startIdx = press.startingHole - 1;
            const endIdx = Math.min(hole, 9) - 1;
            pressScore1 = frontNineScores[player1].slice(startIdx, endIdx + 1).reduce((sum, s) => sum + s, 0);
            pressScore2 = frontNineScores[player2].slice(startIdx, endIdx + 1).reduce((sum, s) => sum + s, 0);
          } else if (press.type === 'back') {
            // Only count holes from press.startingHole to 18
            const startIdx = press.startingHole - 10;
            const endIdx = Math.min(hole, 18) - 10;
            pressScore1 = backNineScores[player1].slice(startIdx, endIdx + 1).reduce((sum, s) => sum + s, 0);
            pressScore2 = backNineScores[player2].slice(startIdx, endIdx + 1).reduce((sum, s) => sum + s, 0);
          } else if (press.type === 'total') {
            // Count all holes from press.startingHole to current hole
            const startIdx = press.startingHole - 1;
            const endIdx = hole - 1;
            pressScore1 = totalScores[player1].slice(startIdx, endIdx + 1).reduce((sum, s) => sum + s, 0);
            pressScore2 = totalScores[player2].slice(startIdx, endIdx + 1).reduce((sum, s) => sum + s, 0);
          }
          
          // Calculate press differential
          const pressDiff = pressScore1 - pressScore2;
          
          // Update press status in hole-by-hole status
          results.forEach(result => {
            const details = result.details as NassauDetails;
            if (details.holeByHoleStatus && details.holeByHoleStatus[hole]) {
              if (!details.holeByHoleStatus[hole].pressesStatus) {
                details.holeByHoleStatus[hole].pressesStatus = {};
              }
              
              details.holeByHoleStatus[hole].pressesStatus[press.id] = 
                result.playerId === player1 ? -pressDiff : pressDiff;
            }
          });
          
          // Check for press of press
          if (automaticPress && hole < press.endingHole) {
            const shouldPressForPlayer1 = pressDiff >= pressTrigger;
            const shouldPressForPlayer2 = pressDiff <= -pressTrigger;
            
            if (shouldPressForPlayer1 && !hasChildPress(presses, press.id, hole)) {
              createPress(presses, press.type, player2, player1, hole, press.endingHole, pressAmount, press.id);
            } else if (shouldPressForPlayer2 && !hasChildPress(presses, press.id, hole)) {
              createPress(presses, press.type, player1, player2, hole, press.endingHole, pressAmount, press.id);
            }
          }
          
          // Update press result if this is the last hole of the press
          if (hole === press.endingHole) {
            if (pressDiff < 0) {
              press.result = 'win'; // Player 2 wins
            } else if (pressDiff > 0) {
              press.result = 'loss'; // Player 1 wins
            } else {
              press.result = 'tie';
            }
          }
        }
      });
    }
  });
  
  // Calculate final front nine, back nine, and total scores
  const finalFrontNineScores: { [playerId: string]: number } = {};
  const finalBackNineScores: { [playerId: string]: number } = {};
  const finalTotalScores: { [playerId: string]: number } = {};
  
  players.forEach(playerId => {
    finalFrontNineScores[playerId] = frontNineScores[playerId].reduce((sum, strokes) => sum + strokes, 0);
    finalBackNineScores[playerId] = backNineScores[playerId].reduce((sum, strokes) => sum + strokes, 0);
    finalTotalScores[playerId] = finalFrontNineScores[playerId] + finalBackNineScores[playerId];
  });
  
  // Determine winners
  let frontNineWinner = '';
  let backNineWinner = '';
  let totalWinner = '';
  
  if (Object.keys(finalFrontNineScores).length > 0) {
    frontNineWinner = players.reduce((winner, playerId) => {
      if (!winner) return playerId;
      return (finalFrontNineScores[playerId] || Infinity) < (finalFrontNineScores[winner] || Infinity) ? playerId : winner;
    }, '');
  }
  
  if (Object.keys(finalBackNineScores).length > 0) {
    backNineWinner = players.reduce((winner, playerId) => {
      if (!winner) return playerId;
      return (finalBackNineScores[playerId] || Infinity) < (finalBackNineScores[winner] || Infinity) ? playerId : winner;
    }, '');
  }
  
  if (Object.keys(finalTotalScores).length > 0) {
    totalWinner = players.reduce((winner, playerId) => {
      if (!winner) return playerId;
      return (finalTotalScores[playerId] || Infinity) < (finalTotalScores[winner] || Infinity) ? playerId : winner;
    }, '');
  }
  
  // Calculate points and amounts
  results.forEach(result => {
    let points = 0;
    let amount = 0;
    const details = result.details as NassauDetails;
    
    if (result.playerId === frontNineWinner) {
      points += 1;
      amount += settings.frontNineStake || 1;
      details.frontNine = 1;
    } else if (frontNineWinner && players.length === 2) {
      details.frontNine = -1;
      amount -= settings.frontNineStake || 1;
    }
    
    if (result.playerId === backNineWinner) {
      points += 1;
      amount += settings.backNineStake || 1;
      details.backNine = 1;
    } else if (backNineWinner && players.length === 2) {
      details.backNine = -1;
      amount -= settings.backNineStake || 1;
    }
    
    if (result.playerId === totalWinner) {
      points += 1;
      amount += settings.totalStake || 1;
      details.total = 1;
    } else if (totalWinner && players.length === 2) {
      details.total = -1;
      amount -= settings.totalStake || 1;
    }
    
    // Add press results
    if (usePress && usePressFunctionality) {
      // Assign presses to players
      details.presses = presses.filter(press => 
        press.initiatedBy === result.playerId || press.initiatedAgainst === result.playerId
      );
      
      // Calculate press amounts
      details.presses.forEach(press => {
        if (press.result === 'pending') {
          // Skip pending presses
          return;
        }
        
        const isInitiator = press.initiatedBy === result.playerId;
        
        if (press.result === 'win') {
          // Initiator wins
          if (isInitiator) {
            amount += press.amount;
            points += 1;
          } else {
            amount -= press.amount;
            points -= 1;
          }
        } else if (press.result === 'loss') {
          // Initiator loses
          if (isInitiator) {
            amount -= press.amount;
            points -= 1;
          } else {
            amount += press.amount;
            points += 1;
          }
        }
        // Ties don't affect amount or points
      });
    }
    
    result.points = points;
    result.amount = amount;
  });
  
  return results;
};

// Helper function to check if a press already exists for a segment
function hasPressForSegment(presses: Press[], type: 'front' | 'back' | 'total', hole: number): boolean {
  return presses.some(press => 
    press.type === type && 
    press.startingHole === hole && 
    press.parentId === undefined
  );
}

// Helper function to check if a child press already exists
function hasChildPress(presses: Press[], parentId: string, hole: number): boolean {
  return presses.some(press => 
    press.parentId === parentId && 
    press.startingHole === hole
  );
}

// Helper function to create a new press
function createPress(
  presses: Press[], 
  type: 'front' | 'back' | 'total', 
  initiatedBy: string, 
  initiatedAgainst: string, 
  startingHole: number, 
  endingHole: number, 
  amount: number,
  parentId?: string
): void {
  const id = `press_${type}_${startingHole}_${Date.now()}`;
  
  presses.push({
    id,
    type,
    parentId,
    startingHole,
    endingHole,
    initiatedBy,
    initiatedAgainst,
    initiatedAtHole: startingHole,
    amount,
    result: 'pending'
  });
}
