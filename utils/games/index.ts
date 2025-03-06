import { calculateNassauScore } from './nassau';
import { calculateSkinsScore } from './skins';
import { calculateStablefordScore } from './stableford';
import { calculateMatchPlayScore } from './matchPlay';
import { calculateVegasScore } from './vegas';
import { calculateWolfScore } from './wolf';
import { calculateBingoBangoBongoScore } from './bingoBangoBongo';
import { calculateQuotaScore } from './quota';
import { calculateNinesScore } from './nines';
import { calculateGarbageScore } from './garbage';
import { calculateSixesScore } from './sixes';
import { HoleScore } from '../../store/slices/roundSlice';
import { GameResult } from '../../store/slices/gameSlice';
import { PlayerWithTee } from '../../store/slices/playerSlice';
import { calculateNetScores, getPlayingHandicaps, getCourseHandicaps } from '../handicapUtils';

// Base interface for all game settings
export interface BaseGameSettings {
  useHandicap?: boolean;
  [key: string]: any;
}

// Game-specific settings interfaces
export interface NassauSettings extends BaseGameSettings {
  frontNineStake: number;
  backNineStake: number;
  totalStake: number;
  usePress: boolean;
  automaticPress: boolean;
  pressAmount: number;
  pressTrigger: number;
}

export interface SkinsSettings extends BaseGameSettings {
  stake: number;
  carryover: boolean;
}

export interface StablefordSettings extends BaseGameSettings {
  stake: number;
  modifiedScoring: boolean;
}

export interface MatchPlaySettings extends BaseGameSettings {
  stake: number;
  usePress: boolean;
  automaticPress: boolean;
  pressAmount: number;
  pressTrigger: number;
}

export interface VegasSettings extends BaseGameSettings {
  stake: number;
  multiplier: number;
}

export interface WolfSettings extends BaseGameSettings {
  stake: number;
  allowLoneWolf: boolean;
  loneWolfMultiplier: number;
}

export interface SixesSettings extends BaseGameSettings {
  stake: number;
}

// Type for all possible game settings
export type GameSettings = 
  | NassauSettings
  | SkinsSettings
  | StablefordSettings
  | MatchPlaySettings
  | VegasSettings
  | WolfSettings
  | SixesSettings
  | BaseGameSettings;

// Game type definitions with additional settings
export const GAME_TYPES = [
  { 
    type: 'nassau', 
    name: 'Nassau', 
    description: 'Front 9, Back 9, Total 18', 
    icon: 'flag',
    settings: {
      supportsPress: true,
      defaultSettings: {
        frontNineStake: 1,
        backNineStake: 1,
        totalStake: 1,
        usePress: true,
        automaticPress: true,
        pressAmount: 1,
        pressTrigger: 2,
        useHandicap: true
      }
    }
  },
  { 
    type: 'skins', 
    name: 'Skins', 
    description: 'Each hole is worth a set amount', 
    icon: 'dollar-sign',
    settings: {
      defaultSettings: {
        stake: 1,
        carryover: true,
        useHandicap: true
      }
    }
  },
  { 
    type: 'match-play', 
    name: 'Match Play', 
    description: 'Win, lose, or halve each hole', 
    icon: 'trophy',
    settings: {
      supportsPress: true,
      defaultSettings: {
        stake: 1,
        usePress: true,
        automaticPress: true,
        pressAmount: 1,
        pressTrigger: 2,
        useHandicap: true
      }
    }
  },
  { 
    type: 'stableford', 
    name: 'Stableford', 
    description: 'Points based on score relative to par', 
    icon: 'chart-bar',
    settings: {
      defaultSettings: {
        stake: 1,
        modifiedScoring: false,
        useHandicap: true
      }
    }
  },
  { 
    type: 'vegas', 
    name: 'Vegas', 
    description: 'Team game with special scoring', 
    icon: 'dice',
    settings: {
      defaultSettings: {
        stake: 1,
        highScoreFirst: true,
        useMultiplier: true,
        multiplier: 2,
        multiplierThreshold: 10,
        useHandicap: true
      }
    }
  },
  { 
    type: 'wolf', 
    name: 'Wolf', 
    description: 'Players take turns being the "Wolf"', 
    icon: 'paw',
    settings: {
      defaultSettings: {
        stake: 1,
        loneWolfMultiplier: 2,
        useHandicap: true
      }
    }
  },
  { 
    type: 'bingo-bango-bongo', 
    name: 'Bingo Bango Bongo', 
    description: 'Points for different achievements on each hole', 
    icon: 'bullseye',
    settings: {
      defaultSettings: {
        bingoValue: 1,
        bangoValue: 1,
        bongoValue: 1,
        useHandicap: false // Typically played without handicaps
      }
    }
  },
  { 
    type: 'quota', 
    name: 'Quota', 
    description: 'Players compete against their own quota', 
    icon: 'tasks',
    settings: {
      defaultSettings: {
        stake: 1,
        useHandicap: true // Quota is inherently handicap-based
      }
    }
  },
  { 
    type: 'nines', 
    name: 'Nines', 
    description: '9 points distributed on each hole', 
    icon: 'list-ol',
    settings: {
      defaultSettings: {
        pointValue: 1,
        useHandicap: true
      }
    }
  },
  { 
    type: 'garbage', 
    name: 'Garbage', 
    description: 'Collection of small side bets', 
    icon: 'recycle',
    settings: {
      defaultSettings: {
        birdieValue: 1,
        eagleValue: 2,
        greenieValue: 1,
        sandyValue: 1,
        barkyValue: 1,
        poleyValue: 1,
        useHandicap: false // Typically played without handicaps
      }
    }
  },
  { 
    type: 'sixes', 
    name: 'Sixes', 
    description: 'Partners rotate every six holes', 
    icon: 'users',
    settings: {
      defaultSettings: {
        stake: 1,
        useHandicap: true
      }
    }
  },
];

// Interface for the course data needed for handicap calculations
export interface CourseData {
  holes: {
    number: number;
    par: number;
    strokeIndex: number;
  }[];
  par: number;
}

// Function to calculate game results based on game type
export const calculateGameResults = (
  gameType: string,
  scores: HoleScore[],
  players: string[],
  settings: Record<string, any>,
  playersWithTees?: PlayerWithTee[],
  courseData?: CourseData
): GameResult[] => {
  // Apply default settings if not provided
  const gameTypeInfo = GAME_TYPES.find(g => g.type === gameType);
  const mergedSettings: GameSettings = {
    ...(gameTypeInfo?.settings?.defaultSettings || {}),
    ...settings
  };

  // Determine if we should use handicaps
  const useHandicap = mergedSettings.useHandicap !== undefined ? mergedSettings.useHandicap : true;
  
  // If using handicaps and we have the necessary data, calculate net scores
  let netScores: Record<string, Record<number, number>> = {};
  let playingHandicaps: Record<string, number> = {};
  let courseHandicaps: Record<string, number> = {};
  
  if (useHandicap && playersWithTees && courseData) {
    // Create a map of hole numbers to stroke indexes
    const strokeIndexes: Record<number, number> = {};
    courseData.holes.forEach(hole => {
      strokeIndexes[hole.number] = hole.strokeIndex;
    });
    
    // Calculate net scores
    netScores = calculateNetScores(scores, playersWithTees, strokeIndexes);
    
    // Get playing handicaps
    playingHandicaps = getPlayingHandicaps(playersWithTees);
    
    // Get course handicaps
    courseHandicaps = getCourseHandicaps(playersWithTees);
    
    // Create net score objects in the same format as HoleScore
    const netScoreObjects: HoleScore[] = [];
    
    scores.forEach(score => {
      if (netScores[score.playerId] && netScores[score.playerId][score.holeNumber] !== undefined) {
        netScoreObjects.push({
          ...score,
          strokes: netScores[score.playerId][score.holeNumber],
          isNetScore: true
        });
      }
    });
    
    // If using handicaps, use net scores for game calculations
    if (useHandicap) {
      scores = netScoreObjects;
    }
  }

  // Add handicap information to settings
  const settingsWithHandicap = {
    ...mergedSettings,
    playingHandicaps,
    courseHandicaps,
    netScores
  };

  // Calculate game results using the appropriate function
  switch (gameType) {
    case 'nassau':
      return calculateNassauScore(scores, players, settingsWithHandicap);
    case 'skins':
      return calculateSkinsScore(scores, players, settingsWithHandicap);
    case 'stableford':
      return calculateStablefordScore(scores, players, settingsWithHandicap);
    case 'match-play':
      return calculateMatchPlayScore(scores, players, settingsWithHandicap);
    case 'vegas':
      return calculateVegasScore(scores, players, settingsWithHandicap);
    case 'wolf':
      return calculateWolfScore(scores, players, settingsWithHandicap);
    case 'bingo-bango-bongo':
      return calculateBingoBangoBongoScore(scores, players, settingsWithHandicap);
    case 'quota':
      return calculateQuotaScore(scores, players, settingsWithHandicap);
    case 'nines':
      return calculateNinesScore(scores, players, settingsWithHandicap);
    case 'garbage':
      return calculateGarbageScore(scores, players, settingsWithHandicap);
    case 'sixes':
      return calculateSixesScore(scores, players, settingsWithHandicap);
    default:
      // For unsupported game types, return empty results
      return players.map(playerId => ({
        playerId,
        points: 0,
        amount: 0
      }));
  }
};
