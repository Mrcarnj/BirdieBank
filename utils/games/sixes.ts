import { HoleScore } from '../../store/slices/roundSlice';
import { GameResult } from '../../store/slices/gameSlice';

interface SixesDetails {
  segments: {
    '1-6': {
      partner: string;
      opponent: string;
      points: number;
    };
    '7-12': {
      partner: string;
      opponent: string;
      points: number;
    };
    '13-18': {
      partner: string;
      opponent: string;
      points: number;
    };
  };
  holeResults: Record<number, {
    partner: string;
    opponent: string;
    teamScore: number;
    opponentScore: number;
    result: 'win' | 'loss' | 'tie';
    points: number;
  }>;
}

// Define segment type for type safety
type SegmentKey = '1-6' | '7-12' | '13-18';

export const calculateSixesScore = (
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
      segments: {
        '1-6': { partner: '', opponent: '', points: 0 },
        '7-12': { partner: '', opponent: '', points: 0 },
        '13-18': { partner: '', opponent: '', points: 0 }
      },
      holeResults: {}
    } as SixesDetails
  }));
  
  // Sixes requires exactly 3 players
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
  
  // Get stake amount
  const stake = settings.stake || 1;
  
  // Define player partnerships for each segment
  const playerA = players[0];
  const playerB = players[1];
  const playerC = players[2];
  
  // Assign partners for each segment
  // Segment 1 (holes 1-6): A and B vs C
  // Segment 2 (holes 7-12): A and C vs B
  // Segment 3 (holes 13-18): B and C vs A
  const partnerships: Record<SegmentKey, Record<string, { partner: string; opponent: string }>> = {
    '1-6': {
      [playerA]: { partner: playerB, opponent: playerC },
      [playerB]: { partner: playerA, opponent: playerC },
      [playerC]: { partner: '', opponent: `${playerA},${playerB}` }
    },
    '7-12': {
      [playerA]: { partner: playerC, opponent: playerB },
      [playerB]: { partner: '', opponent: `${playerA},${playerC}` },
      [playerC]: { partner: playerA, opponent: playerB }
    },
    '13-18': {
      [playerA]: { partner: '', opponent: `${playerB},${playerC}` },
      [playerB]: { partner: playerC, opponent: playerA },
      [playerC]: { partner: playerB, opponent: playerA }
    }
  };
  
  // Set up partnerships in results
  results.forEach(result => {
    if (!result.details) return;
    
    const details = result.details as SixesDetails;
    const playerId = result.playerId;
    
    // Set up segment 1 (holes 1-6)
    details.segments['1-6'].partner = partnerships['1-6'][playerId].partner;
    details.segments['1-6'].opponent = partnerships['1-6'][playerId].opponent;
    
    // Set up segment 2 (holes 7-12)
    details.segments['7-12'].partner = partnerships['7-12'][playerId].partner;
    details.segments['7-12'].opponent = partnerships['7-12'][playerId].opponent;
    
    // Set up segment 3 (holes 13-18)
    details.segments['13-18'].partner = partnerships['13-18'][playerId].partner;
    details.segments['13-18'].opponent = partnerships['13-18'][playerId].opponent;
  });
  
  // Process each hole
  playedHoles.forEach(hole => {
    const holeScoreList = holeScores[hole];
    
    // Skip holes with incomplete data
    if (holeScoreList.length < 3) {
      return;
    }
    
    // Determine which segment this hole belongs to
    let segment: SegmentKey | '' = '';
    if (hole >= 1 && hole <= 6) {
      segment = '1-6';
    } else if (hole >= 7 && hole <= 12) {
      segment = '7-12';
    } else if (hole >= 13 && hole <= 18) {
      segment = '13-18';
    } else {
      // Skip holes outside the standard 18
      return;
    }
    
    // Get scores for this hole
    const holePlayerScores: { [playerId: string]: number } = {};
    holeScoreList.forEach(score => {
      holePlayerScores[score.playerId] = score.strokes;
    });
    
    // Calculate team scores for this hole
    const teamScores: { [teamId: string]: number } = {
      'AB': holePlayerScores[playerA] + holePlayerScores[playerB],
      'AC': holePlayerScores[playerA] + holePlayerScores[playerC],
      'BC': holePlayerScores[playerB] + holePlayerScores[playerC],
      'A': holePlayerScores[playerA],
      'B': holePlayerScores[playerB],
      'C': holePlayerScores[playerC]
    };
    
    // Determine winners for this hole
    results.forEach(gameResult => {
      if (!gameResult.details) return;
      
      const details = gameResult.details as SixesDetails;
      const playerId = gameResult.playerId;
      
      // Skip if segment is empty
      if (!segment) return;
      
      const partnership = partnerships[segment][playerId];
      
      // Skip if partnership info is missing
      if (!partnership) return;
      
      // Calculate team scores
      let teamScore = 0;
      let opponentScore = 0;
      
      if (partnership.partner) {
        // Player is in a team
        const partnerId = partnership.partner;
        teamScore = holePlayerScores[playerId] + holePlayerScores[partnerId];
        opponentScore = holePlayerScores[partnership.opponent];
      } else {
        // Player is alone
        teamScore = holePlayerScores[playerId];
        const opponents = partnership.opponent.split(',');
        opponentScore = opponents.reduce((sum: number, oppId: string) => sum + holePlayerScores[oppId], 0);
      }
      
      // Determine result (lower score wins in golf)
      let holeResult: 'win' | 'loss' | 'tie' = 'tie';
      let points = 0;
      
      if (teamScore < opponentScore) {
        holeResult = 'win';
        points = 1;
      } else if (teamScore > opponentScore) {
        holeResult = 'loss';
        points = -1;
      }
      
      // Record hole result
      details.holeResults[hole] = {
        partner: partnership.partner,
        opponent: partnership.opponent,
        teamScore,
        opponentScore,
        result: holeResult,
        points
      };
      
      // Update segment points
      if (segment) {
        details.segments[segment].points += points;
      }
      
      // Update total points
      gameResult.points += points;
    });
  });
  
  // Calculate final amounts
  results.forEach(result => {
    if (!result.details) return;
    
    const details = result.details as SixesDetails;
    let totalAmount = 0;
    
    // Calculate amount for each segment
    Object.keys(details.segments).forEach(segmentKey => {
      const segment = details.segments[segmentKey as keyof typeof details.segments];
      totalAmount += segment.points * stake;
    });
    
    result.amount = totalAmount;
  });
  
  return results;
}; 