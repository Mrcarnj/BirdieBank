import { HoleScore } from '../../store/slices/roundSlice';
import { GameResult } from '../../store/slices/gameSlice';
import { getMatchPlayStrokesReceived } from '../handicapUtils';

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
  frontNine: string; // Changed to string to match match play status format
  backNine: string;  // Changed to string to match match play status format
  total: string;     // Changed to string to match match play status format
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
  // Initialize results
  const results: GameResult[] = players.map(playerId => ({
    playerId,
    points: 0,
    amount: 0,
    details: {
      frontNine: 'AS',  // Start as All Square
      backNine: 'AS',   // Start as All Square
      total: 'AS',      // Start as All Square
      presses: [],
      holeByHoleStatus: {}
    } as NassauDetails
  }));
  
  // If there are not exactly 2 players/teams, return basic results without presses
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
  
  // Track match status for each segment
  let frontNineUp = 0;  // Positive means player1 is up, negative means player2 is up
  let backNineUp = 0;   // Positive means player1 is up, negative means player2 is up
  let totalUp = 0;      // Positive means player1 is up, negative means player2 is up
  
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
    
    // Get handicap information if available
    const player1Handicap = settings.courseHandicaps?.[player1] || 0;
    const player2Handicap = settings.courseHandicaps?.[player2] || 0;
    
    // Get the stroke index for the hole
    const strokeIndex = settings.course?.holes?.find((h: { number: number }) => h.number === hole)?.handicap || 0;
    
    // Calculate strokes received for match play
    const player1StrokesReceived = getMatchPlayStrokesReceived(player1Handicap, player2Handicap, strokeIndex);
    const player2StrokesReceived = getMatchPlayStrokesReceived(player2Handicap, player1Handicap, strokeIndex);
    
    // Calculate net scores
    const player1NetScore = player1Score - player1StrokesReceived;
    const player2NetScore = player2Score - player2StrokesReceived;
    
    // Determine hole winner using net scores
    if (player1NetScore < player2NetScore) {
      // Player 1 wins hole
      totalUp++;
      if (hole <= 9) frontNineUp++;
      if (hole > 9) backNineUp++;
    } else if (player2NetScore < player1NetScore) {
      // Player 2 wins hole
      totalUp--;
      if (hole <= 9) frontNineUp--;
      if (hole > 9) backNineUp--;
    }
    // If scores are equal, hole is halved (no change to status)
    
    // Update hole-by-hole status
    results.forEach(result => {
      const details = result.details as NassauDetails;
      if (!details.holeByHoleStatus) {
        details.holeByHoleStatus = {};
      }
      
      details.holeByHoleStatus[hole] = {
        frontNineStatus: result.playerId === player1 ? frontNineUp : -frontNineUp,
        backNineStatus: result.playerId === player1 ? backNineUp : -backNineUp,
        totalStatus: result.playerId === player1 ? totalUp : -totalUp,
        pressesStatus: {}
      };
      
      // Update match status strings
      if (result.playerId === player1) {
        details.frontNine = formatMatchStatus(frontNineUp, hole <= 9 ? 9 - hole : 0);
        details.backNine = formatMatchStatus(backNineUp, hole > 9 ? 18 - hole : 9);
        details.total = formatMatchStatus(totalUp, 18 - hole);
      } else {
        details.frontNine = formatMatchStatus(-frontNineUp, hole <= 9 ? 9 - hole : 0);
        details.backNine = formatMatchStatus(-backNineUp, hole > 9 ? 18 - hole : 9);
        details.total = formatMatchStatus(-totalUp, 18 - hole);
      }
    });
    
    // ... rest of the press handling code ...
  });
  
  // Calculate final points and amounts
  results.forEach(result => {
    const details = result.details as NassauDetails;
    const isPlayer1 = result.playerId === player1;
    
    // Front nine
    if (frontNineUp !== 0) {
      if ((isPlayer1 && frontNineUp > 0) || (!isPlayer1 && frontNineUp < 0)) {
        result.points += 1;
        result.amount += settings.frontNineStake || 1;
      } else {
        result.points -= 1;
        result.amount -= settings.frontNineStake || 1;
      }
    }
    
    // Back nine
    if (backNineUp !== 0) {
      if ((isPlayer1 && backNineUp > 0) || (!isPlayer1 && backNineUp < 0)) {
        result.points += 1;
        result.amount += settings.backNineStake || 1;
      } else {
        result.points -= 1;
        result.amount -= settings.backNineStake || 1;
      }
    }
    
    // Overall
    if (totalUp !== 0) {
      if ((isPlayer1 && totalUp > 0) || (!isPlayer1 && totalUp < 0)) {
        result.points += 1;
        result.amount += settings.overallStake || 1;
      } else {
        result.points -= 1;
        result.amount -= settings.overallStake || 1;
      }
    }
  });
  
  return results;
};

// Helper function to format match status like match play
function formatMatchStatus(up: number, holesRemaining: number): string {
  if (up === 0) return 'AS';
  if (up > 0) {
    return holesRemaining === 0 || up > holesRemaining 
      ? `Won ${up} & ${holesRemaining}`
      : `${up} UP`;
  }
  const down = Math.abs(up);
  return holesRemaining === 0 || down > holesRemaining
    ? `Lost ${down} & ${holesRemaining}`
    : `${down} DN`;
}
