import { HoleScore } from '../../store/slices/roundSlice';
import { GameResult } from '../../store/slices/gameSlice';

interface GarbageDetails {
  achievements: {
    birdies: number;
    eagles: number;
    greenies: number;
    sandies: number;
    barkies: number;
    poleys: number;
  };
  holeResults: Record<number, {
    achievements: string[];
    points: number;
  }>;
}

export const calculateGarbageScore = (
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
      achievements: {
        birdies: 0,
        eagles: 0,
        greenies: 0,
        sandies: 0,
        barkies: 0,
        poleys: 0
      },
      holeResults: {}
    } as GarbageDetails
  }));
  
  // Garbage requires at least 2 players
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
  
  // Get achievement values from settings
  const achievementValues = {
    birdie: settings.birdieValue || 1,
    eagle: settings.eagleValue || 2,
    greenie: settings.greenieValue || 1,
    sandy: settings.sandyValue || 1,
    barky: settings.barkyValue || 1,
    poley: settings.poleyValue || 1
  };
  
  // Process each hole
  playedHoles.forEach(hole => {
    const holeScoreList = holeScores[hole];
    const holePar = settings.holePars?.[hole] || 4; // Default to par 4 if not specified
    const isParThree = holePar === 3;
    
    // Initialize hole results for each player
    results.forEach(result => {
      if (result.details) {
        (result.details as GarbageDetails).holeResults[hole] = {
          achievements: [],
          points: 0
        };
      }
    });
    
    // Process each player's score for this hole
    holeScoreList.forEach(score => {
      const playerId = score.playerId;
      const strokes = score.strokes;
      const playerResult = results.find(r => r.playerId === playerId);
      
      if (!playerResult || !playerResult.details) return;
      
      const details = playerResult.details as GarbageDetails;
      const holeResult = details.holeResults[hole];
      let holePoints = 0;
      
      // Check for birdies and eagles
      const scoreToPar = strokes - holePar;
      if (scoreToPar === -1) {
        // Birdie
        details.achievements.birdies++;
        holeResult.achievements.push('Birdie');
        holePoints += achievementValues.birdie;
      } else if (scoreToPar <= -2) {
        // Eagle or better
        details.achievements.eagles++;
        holeResult.achievements.push('Eagle');
        holePoints += achievementValues.eagle;
      }
      
      // Check for greenies (closest to pin on par 3s)
      // In a real implementation, this would use actual "closest to pin" data
      // For this simulation, we'll use a flag in the score data
      if (isParThree && score.closestToPin) {
        details.achievements.greenies++;
        holeResult.achievements.push('Greenie');
        holePoints += achievementValues.greenie;
      }
      
      // Check for sandies (par after bunker shot)
      // In a real implementation, this would use actual "bunker shot" data
      // For this simulation, we'll use a flag in the score data
      if (scoreToPar <= 0 && score.bunkerShot) {
        details.achievements.sandies++;
        holeResult.achievements.push('Sandy');
        holePoints += achievementValues.sandy;
      }
      
      // Check for barkies (par after hitting a tree)
      // In a real implementation, this would use actual "hit tree" data
      // For this simulation, we'll use a flag in the score data
      if (scoreToPar <= 0 && score.hitTree) {
        details.achievements.barkies++;
        holeResult.achievements.push('Barky');
        holePoints += achievementValues.barky;
      }
      
      // Check for poleys (making a putt longer than the flagstick)
      // In a real implementation, this would use actual "long putt" data
      // For this simulation, we'll use a flag in the score data
      if (score.longPutt) {
        details.achievements.poleys++;
        holeResult.achievements.push('Poley');
        holePoints += achievementValues.poley;
      }
      
      // Update hole points
      holeResult.points = holePoints;
      playerResult.points += holePoints;
    });
  });
  
  // Calculate final amounts
  // Each player pays or receives based on their points relative to others
  const totalPoints = results.reduce((sum, result) => sum + result.points, 0);
  const pointsPerPlayer = totalPoints / players.length;
  
  results.forEach(result => {
    // Calculate amount based on points above/below average
    const pointDifferential = result.points - pointsPerPlayer;
    result.amount = pointDifferential;
  });
  
  return results;
}; 