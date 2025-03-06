import { HoleScore } from '../../store/slices/roundSlice';
import { GameResult } from '../../store/slices/gameSlice';

interface WolfDetails {
  wolfHoles: number[];
  loneWolfHoles: number[];
  partnerHoles: Record<number, string>;
  holeResults: Record<number, number>;
}

export const calculateWolfScore = (
  scores: HoleScore[], 
  players: string[], 
  settings: Record<string, any>
): GameResult[] => {
  // Wolf is ideally played with 4 players
  // Initialize results
  const results: GameResult[] = players.map(playerId => ({
    playerId,
    points: 0,
    amount: 0,
    details: {
      wolfHoles: [] as number[],
      loneWolfHoles: [] as number[],
      partnerHoles: {} as Record<number, string>,
      holeResults: {} as Record<number, number>
    } as WolfDetails
  }));
  
  // Wolf requires at least 3 players, ideally 4
  if (players.length < 3) {
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
  
  // Process each hole
  playedHoles.forEach(hole => {
    const holeScoreList = holeScores[hole];
    
    // Determine who is the Wolf for this hole
    // Wolf rotates each hole, so we use modulo to determine the Wolf
    const wolfIndex = (hole - 1) % players.length;
    const wolfId = players[wolfIndex];
    
    // Mark this hole as a Wolf hole for this player
    const wolfResult = results.find(r => r.playerId === wolfId);
    if (wolfResult && wolfResult.details) {
      (wolfResult.details as WolfDetails).wolfHoles.push(hole);
    }
    
    // Get Wolf's partner for this hole from settings
    const wolfPartner = settings.partners?.[hole];
    
    // Determine if Wolf is playing alone (lone wolf)
    const isLoneWolf = !wolfPartner;
    
    if (isLoneWolf && wolfResult && wolfResult.details) {
      (wolfResult.details as WolfDetails).loneWolfHoles.push(hole);
    }
    
    // Record partner information
    if (wolfPartner && wolfResult && wolfResult.details) {
      (wolfResult.details as WolfDetails).partnerHoles[hole] = wolfPartner;
      
      // Also record for the partner
      const partnerResult = results.find(r => r.playerId === wolfPartner);
      if (partnerResult && partnerResult.details) {
        (partnerResult.details as WolfDetails).partnerHoles[hole] = wolfId;
      }
    }
    
    // Calculate team scores
    let wolfTeamScore = 0;
    let otherTeamScore = 0;
    
    // Process each player's score
    holeScoreList.forEach(score => {
      const playerId = score.playerId;
      const strokes = score.strokes;
      
      // Skip if no strokes recorded
      if (!strokes) return;
      
      // Determine if player is on Wolf's team
      const isWolf = playerId === wolfId;
      const isWolfPartner = playerId === wolfPartner;
      const isOnWolfTeam = isWolf || isWolfPartner;
      
      // Add score to appropriate team
      if (isOnWolfTeam) {
        wolfTeamScore += strokes;
      } else {
        otherTeamScore += strokes;
      }
    });
    
    // Determine the winning team
    let wolfTeamWins = false;
    
    if (wolfTeamScore && otherTeamScore) {
      // Lower score wins in golf
      wolfTeamWins = wolfTeamScore < otherTeamScore;
    }
    
    // Calculate points and amounts
    let wolfAmount = 0;
    let partnerAmount = 0;
    let otherAmount = 0;
    
    if (wolfTeamWins) {
      // Wolf team wins
      if (isLoneWolf) {
        // Lone Wolf wins - gets points from all other players
        wolfAmount = stake * (players.length - 1) * (settings.loneWolfMultiplier || 2);
        otherAmount = -stake * (settings.loneWolfMultiplier || 2);
      } else {
        // Wolf with partner wins
        wolfAmount = stake * (players.length - 2);
        partnerAmount = stake * (players.length - 2);
        otherAmount = -stake * 2;
      }
    } else {
      // Wolf team loses
      if (isLoneWolf) {
        // Lone Wolf loses - pays all other players
        wolfAmount = -stake * (players.length - 1);
        otherAmount = stake;
      } else {
        // Wolf with partner loses
        wolfAmount = -stake;
        partnerAmount = -stake;
        otherAmount = stake;
      }
    }
    
    // Update results for each player
    results.forEach(result => {
      if (!result.details) return;
      
      const playerId = result.playerId;
      const isWolf = playerId === wolfId;
      const isWolfPartner = playerId === wolfPartner;
      
      // Record hole result
      if (isWolf) {
        result.amount += wolfAmount;
        result.points += wolfTeamWins ? 1 : -1;
        (result.details as WolfDetails).holeResults[hole] = wolfAmount;
      } else if (isWolfPartner) {
        result.amount += partnerAmount;
        result.points += wolfTeamWins ? 1 : -1;
        (result.details as WolfDetails).holeResults[hole] = partnerAmount;
      } else {
        result.amount += otherAmount;
        result.points += wolfTeamWins ? -1 : 1;
        (result.details as WolfDetails).holeResults[hole] = otherAmount;
      }
    });
  });
  
  return results;
};
