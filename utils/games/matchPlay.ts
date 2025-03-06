import { HoleScore } from '../../store/slices/roundSlice';
import { GameResult } from '../../store/slices/gameSlice';

interface Press {
  id: string;
  parentId?: string;
  startingHole: number;
  endingHole: number;
  initiatedBy: string;
  initiatedAgainst: string;
  initiatedAtHole: number;
  amount: number;
  result: 'win' | 'loss' | 'tie' | 'pending';
}

interface MatchPlayDetails {
  holesWon: number;
  holesLost: number;
  holesHalved: number;
  matchStatus: string;
  presses: Press[];
  holeByHoleStatus?: Record<number, {
    matchStatus: number; // Positive means up, negative means down, 0 means all square
    pressesStatus?: Record<string, number>;
  }>;
}

export const calculateMatchPlayScore = (
  scores: HoleScore[], 
  players: string[], 
  settings: Record<string, any>
): GameResult[] => {
  // Match Play is typically played between 2 players or 2 teams
  // Initialize results
  const results: GameResult[] = players.map(playerId => ({
    playerId,
    points: 0,
    amount: 0,
    details: {
      holesWon: 0,
      holesLost: 0,
      holesHalved: 0,
      matchStatus: 'All Square',
      presses: [],
      holeByHoleStatus: {}
    } as MatchPlayDetails
  }));
  
  // If there are not exactly 2 players/teams, return empty results
  if (players.length !== 2) {
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
  
  // Get press settings
  const usePress = settings.usePress !== undefined ? settings.usePress : false;
  const automaticPress = settings.automaticPress !== undefined ? settings.automaticPress : false;
  const pressAmount = settings.pressAmount || 1;
  const pressTrigger = settings.pressTrigger || 2; // Default to 2-down trigger
  
  // Initialize press tracking
  const presses: Press[] = [];
  
  // Track match status
  let player1Up = 0; // Positive means player1 is up, negative means player2 is up
  const player1 = players[0];
  const player2 = players[1];
  
  // Process each hole in order
  playedHoles.forEach(hole => {
    const holeScoreList = holeScores[hole];
    
    // Find scores for both players
    const player1Score = holeScoreList.find(score => score.playerId === player1)?.strokes;
    const player2Score = holeScoreList.find(score => score.playerId === player2)?.strokes;
    
    // Skip holes where either player doesn't have a score
    if (player1Score === undefined || player2Score === undefined) {
      return;
    }
    
    // Determine hole winner
    if (player1Score < player2Score) {
      // Player 1 wins hole
      player1Up++;
      (results[0].details as MatchPlayDetails).holesWon++;
      (results[1].details as MatchPlayDetails).holesLost++;
    } else if (player2Score < player1Score) {
      // Player 2 wins hole
      player1Up--;
      (results[0].details as MatchPlayDetails).holesLost++;
      (results[1].details as MatchPlayDetails).holesWon++;
    } else {
      // Hole is halved
      (results[0].details as MatchPlayDetails).holesHalved++;
      (results[1].details as MatchPlayDetails).holesHalved++;
    }
    
    // Update hole-by-hole status
    results.forEach(result => {
      const details = result.details as MatchPlayDetails;
      if (!details.holeByHoleStatus) {
        details.holeByHoleStatus = {};
      }
      
      details.holeByHoleStatus[hole] = {
        matchStatus: result.playerId === player1 ? player1Up : -player1Up,
        pressesStatus: {}
      };
    });
    
    // Check for press conditions
    if (usePress) {
      // Check if a new press should be initiated
      const shouldPressForPlayer1 = player1Up <= -pressTrigger;
      const shouldPressForPlayer2 = player1Up >= pressTrigger;
      
      if (automaticPress) {
        // Automatic press
        if (shouldPressForPlayer1 && !hasPressForHole(presses, hole)) {
          createPress(presses, player1, player2, hole, 18, pressAmount);
        } else if (shouldPressForPlayer2 && !hasPressForHole(presses, hole)) {
          createPress(presses, player2, player1, hole, 18, pressAmount);
        }
      }
      
      // Update press status for each hole
      presses.forEach(press => {
        if (hole >= press.startingHole && hole <= press.endingHole) {
          // Calculate press score for this hole range
          let pressPlayer1Up = 0;
          
          // For each hole in the press range that has been played
          for (let h = press.startingHole; h <= Math.min(hole, press.endingHole); h++) {
            const hScores = holeScores[h];
            if (!hScores) continue;
            
            const p1Score = hScores.find(score => score.playerId === player1)?.strokes;
            const p2Score = hScores.find(score => score.playerId === player2)?.strokes;
            
            if (p1Score === undefined || p2Score === undefined) continue;
            
            if (p1Score < p2Score) {
              pressPlayer1Up++;
            } else if (p2Score < p1Score) {
              pressPlayer1Up--;
            }
          }
          
          // Update press status in hole-by-hole status
          results.forEach(result => {
            const details = result.details as MatchPlayDetails;
            if (details.holeByHoleStatus && details.holeByHoleStatus[hole]) {
              if (!details.holeByHoleStatus[hole].pressesStatus) {
                details.holeByHoleStatus[hole].pressesStatus = {};
              }
              
              details.holeByHoleStatus[hole].pressesStatus[press.id] = 
                result.playerId === player1 ? pressPlayer1Up : -pressPlayer1Up;
            }
          });
          
          // Check for press of press
          if (automaticPress && hole < press.endingHole) {
            const shouldPressOfPressForPlayer1 = pressPlayer1Up <= -pressTrigger;
            const shouldPressOfPressForPlayer2 = pressPlayer1Up >= pressTrigger;
            
            if (shouldPressOfPressForPlayer1 && !hasChildPress(presses, press.id, hole)) {
              createPress(presses, player1, player2, hole, press.endingHole, pressAmount, press.id);
            } else if (shouldPressOfPressForPlayer2 && !hasChildPress(presses, press.id, hole)) {
              createPress(presses, player2, player1, hole, press.endingHole, pressAmount, press.id);
            }
          }
          
          // Update press result if this is the last hole of the press
          if (hole === press.endingHole) {
            if (pressPlayer1Up > 0) {
              press.result = press.initiatedBy === player1 ? 'win' : 'loss';
            } else if (pressPlayer1Up < 0) {
              press.result = press.initiatedBy === player1 ? 'loss' : 'win';
            } else {
              press.result = 'tie';
            }
          }
        }
      });
    }
  });
  
  // Calculate match status
  const holesRemaining = 18 - playedHoles.length;
  
  if (player1Up > 0) {
    // Player 1 is up
    if (player1Up > holesRemaining) {
      // Player 1 has won the match
      (results[0].details as MatchPlayDetails).matchStatus = `Won ${player1Up} & ${holesRemaining}`;
      (results[1].details as MatchPlayDetails).matchStatus = `Lost ${player1Up} & ${holesRemaining}`;
      
      // Calculate points and amount
      results[0].points = 1;
      results[0].amount = settings.stake || 1;
      results[1].points = -1;
      results[1].amount = -(settings.stake || 1);
    } else {
      // Match is still ongoing
      (results[0].details as MatchPlayDetails).matchStatus = `${player1Up} Up`;
      (results[1].details as MatchPlayDetails).matchStatus = `${player1Up} Down`;
    }
  } else if (player1Up < 0) {
    // Player 2 is up
    const player2Up = Math.abs(player1Up);
    
    if (player2Up > holesRemaining) {
      // Player 2 has won the match
      (results[1].details as MatchPlayDetails).matchStatus = `Won ${player2Up} & ${holesRemaining}`;
      (results[0].details as MatchPlayDetails).matchStatus = `Lost ${player2Up} & ${holesRemaining}`;
      
      // Calculate points and amount
      results[1].points = 1;
      results[1].amount = settings.stake || 1;
      results[0].points = -1;
      results[0].amount = -(settings.stake || 1);
    } else {
      // Match is still ongoing
      (results[1].details as MatchPlayDetails).matchStatus = `${player2Up} Up`;
      (results[0].details as MatchPlayDetails).matchStatus = `${player2Up} Down`;
    }
  } else {
    // Match is all square
    (results[0].details as MatchPlayDetails).matchStatus = 'All Square';
    (results[1].details as MatchPlayDetails).matchStatus = 'All Square';
  }
  
  // Add press results
  if (usePress) {
    // Assign presses to players
    results.forEach(result => {
      const details = result.details as MatchPlayDetails;
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
            result.amount += press.amount;
            result.points += 1;
          } else {
            result.amount -= press.amount;
            result.points -= 1;
          }
        } else if (press.result === 'loss') {
          // Initiator loses
          if (isInitiator) {
            result.amount -= press.amount;
            result.points -= 1;
          } else {
            result.amount += press.amount;
            result.points += 1;
          }
        }
        // Ties don't affect amount or points
      });
    });
  }
  
  return results;
};

// Helper function to check if a press already exists for a hole
function hasPressForHole(presses: Press[], hole: number): boolean {
  return presses.some(press => 
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
  initiatedBy: string, 
  initiatedAgainst: string, 
  startingHole: number, 
  endingHole: number, 
  amount: number,
  parentId?: string
): void {
  const id = `press_${startingHole}_${Date.now()}`;
  
  presses.push({
    id,
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
