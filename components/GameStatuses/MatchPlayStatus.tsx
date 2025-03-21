import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { HoleScore } from '../../store/slices/roundSlice';
import { PlayerWithTee } from '../../store/slices/playerSlice';
import { Course, Hole } from '../../store/slices/courseSlice';
import { getMatchPlayStrokesReceived } from '../../utils/handicapUtils';
import { useTheme } from '../ThemeProvider';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface MatchPlayStatusProps {
  players: PlayerWithTee[];
  scores: HoleScore[];
  course: Course;
  currentHole: number;
  holeRange: number[];
  courseHandicaps: Record<string, number>;
}

interface MatchPlayResult {
  status: string;
  playerUp: string | null;
  holesUp: number;
  holesPlayed: number;
  holesRemaining: number;
  isAllSquare: boolean;
  isDormie: boolean;
  isMatchOver: boolean;
  winnerName?: string;
  winResult?: string;
}

const MatchPlayStatus: React.FC<MatchPlayStatusProps> = ({
  players,
  scores,
  course,
  currentHole,
  holeRange,
  courseHandicaps
}) => {
  const { colors } = useTheme();
  const { selectedGames } = useSelector((state: RootState) => state.game);
  
  // Add state to store the final result once a match is won
  const [finalMatchResult, setFinalMatchResult] = useState<MatchPlayResult | null>(null);
  
  // Find match play game and get stake information
  const matchPlayGame = useMemo(() => {
    return selectedGames.find(game => game.type === 'match-play');
  }, [selectedGames]);
  
  // Get stake amount from game settings
  const stakeAmount = useMemo(() => {
    if (!matchPlayGame) return 0;
    
    // Log the match play game data for debugging
    console.log('Match play game:', JSON.stringify(matchPlayGame, null, 2));
    
    // Check multiple possible locations for the stake value
    let stake = 0;
    
    if (matchPlayGame.stake !== undefined) {
      stake = parseFloat(String(matchPlayGame.stake));
      console.log('Using stake directly from game:', stake);
    } else if (matchPlayGame.settings?.stake !== undefined) {
      stake = parseFloat(String(matchPlayGame.settings.stake));
      console.log('Using stake from game settings:', stake);
    }
    
    console.log('Final stake amount:', stake);
    return isNaN(stake) ? 0 : stake;
  }, [matchPlayGame]);

  // Format player names as first name + last initial
  const formatPlayerName = (player: PlayerWithTee): string => {
    const nameParts = player.name.split(' ');
    const firstName = nameParts[0];
    const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0) : '';
    return `${firstName} ${lastInitial}.`;
  };

  // Match play is only for 2 players
  if (players.length !== 2) {
    return null;
  }

  const getHoleData = (holeNumber: number): Hole | undefined => {
    return course.holes.find(hole => hole.number === holeNumber);
  };

  // Calculate match play result
  const currentMatchResult = useMemo((): MatchPlayResult | null => {
    // If we already have a final result, return that instead of calculating a new one
    if (finalMatchResult) {
      return finalMatchResult;
    }

    // Not enough players or no score data
    if (players.length !== 2 || !scores) {
      return null;
    }

    const player1 = players[0];
    const player2 = players[1];
    
    // Format player names as first name + last initial
    const player1Name = formatPlayerName(player1);
    const player2Name = formatPlayerName(player2);
    
    let player1Up = 0; // Positive means player1 is up, negative means player2 is up
    let holesPlayed = 0;

    // Only consider holes up to current hole that have been played
    const playedHoles = holeRange.filter(hole => {
      // Check if the hole is in the hole range and is less than or equal to current hole
      return hole <= currentHole;
    });
    
    // Sort holes numerically
    playedHoles.sort((a, b) => a - b);
    
    // Process each hole
    playedHoles.forEach(hole => {
      const player1Score = scores.find(s => s.playerId === player1.id && s.holeNumber === hole)?.strokes;
      const player2Score = scores.find(s => s.playerId === player2.id && s.holeNumber === hole)?.strokes;
      
      // Skip holes where either player doesn't have a score
      if (player1Score === undefined || player2Score === undefined) {
        return;
      }
      
      holesPlayed++;
      
      // Get the hole data for stroke index
      const holeData = getHoleData(hole);
      if (!holeData) return;
      
      const strokeIndex = holeData.handicap || 0;
      
      // Calculate strokes received for match play
      const player1Handicap = courseHandicaps[player1.id] || 0;
      const player2Handicap = courseHandicaps[player2.id] || 0;
      
      const player1StrokesReceived = getMatchPlayStrokesReceived(player1Handicap, player2Handicap, strokeIndex);
      const player2StrokesReceived = getMatchPlayStrokesReceived(player2Handicap, player1Handicap, strokeIndex);
      
      // Calculate net scores for the hole
      const player1NetScore = player1Score - player1StrokesReceived;
      const player2NetScore = player2Score - player2StrokesReceived;

      // Determine hole winner
      if (player1NetScore < player2NetScore) {
        // Player 1 wins hole
        player1Up++;
      } else if (player2NetScore < player1NetScore) {
        // Player 2 wins hole
        player1Up--;
      }
      // Hole is halved if scores are equal - no change to player1Up
    });

    // Calculate holes remaining
    // Full round has 18 holes, or use the holeRange length if it's less than 18
    const totalHoles = Math.min(18, holeRange.length);
    const holesRemaining = totalHoles - holesPlayed;
    
    // Initialize result
    let status = 'All Square';
    let playerUp = null;
    let holesUp = 0;
    let isAllSquare = true;
    let isDormie = false;
    let isMatchOver = false;
    let winnerName = '';
    let winResult = '';
    
    // Check if match is all square
    if (player1Up === 0 && holesPlayed > 0) {
      status = `All Square thru ${holesPlayed}`;
      isAllSquare = true;
    }
    // Check if player 1 is up
    else if (player1Up > 0) {
      playerUp = player1.id;
      holesUp = player1Up;
      isAllSquare = false;
    
      // Check if player 1 has won
      if (player1Up > holesRemaining) {
        isMatchOver = true;
        winnerName = player1Name;
        winResult = `${player1Up} & ${holesRemaining}`;
        status = `${player1Name} wins ${winResult}`;
      }
      // Check if match is dormie (player is up by exactly the number of holes remaining)
      else if (player1Up === holesRemaining && holesRemaining > 0) {
        isDormie = true;
        status = `${player1Name} ${player1Up} UP - Match Dormie`;
      }
      // Regular status
      else {
        status = `${player1Name} ${player1Up} UP thru ${holesPlayed}`;
      }
    }
    // Check if player 2 is up
    else if (player1Up < 0) {
      const player2Up = Math.abs(player1Up);
      playerUp = player2.id;
      holesUp = player2Up;
      isAllSquare = false;
      
      // Check if player 2 has won
      if (player2Up > holesRemaining) {
        isMatchOver = true;
        winnerName = player2Name;
        winResult = `${player2Up} & ${holesRemaining}`;
        status = `${player2Name} wins ${winResult}`;
      }
      // Check if match is dormie
      else if (player2Up === holesRemaining && holesRemaining > 0) {
        isDormie = true;
        status = `${player2Name} ${player2Up} UP - Match Dormie`;
      }
      // Regular status
      else {
        status = `${player2Name} ${player2Up} UP thru ${holesPlayed}`;
      }
    }

    return {
      status,
      playerUp,
      holesUp,
      holesPlayed,
      holesRemaining,
      isAllSquare,
      isDormie,
      isMatchOver,
      winnerName,
      winResult
    };
  }, [players, scores, currentHole, holeRange, courseHandicaps, finalMatchResult]);

  // Get match play strokes for current hole
  const currentHoleStrokes = useMemo(() => {
    if (players.length !== 2) return null;
    
    const player1 = players[0];
    const player2 = players[1];
    
    const holeData = getHoleData(currentHole);
    if (!holeData) return null;
    
    const strokeIndex = holeData.handicap || 0;
    
    const player1Handicap = courseHandicaps[player1.id] || 0;
    const player2Handicap = courseHandicaps[player2.id] || 0;
    
    return {
      player1: {
        id: player1.id,
        name: player1.name,
        strokesReceived: getMatchPlayStrokesReceived(player1Handicap, player2Handicap, strokeIndex)
      },
      player2: {
        id: player2.id,
        name: player2.name,
        strokesReceived: getMatchPlayStrokesReceived(player2Handicap, player1Handicap, strokeIndex)
      }
    };
  }, [players, currentHole, courseHandicaps]);

  // If we don't have match play strokes or match result, don't render anything
  if (!currentHoleStrokes || !currentMatchResult) {
    return null;
  }

  // Store the final result when the match is won
  useEffect(() => {
    if (currentMatchResult.isMatchOver && !finalMatchResult) {
      setFinalMatchResult(currentMatchResult);
    }
  }, [currentMatchResult, finalMatchResult]);

  // Format stake text
  const stakeDisplay = () => {
    if (!currentMatchResult.isMatchOver) return null;
    
    // Always show something about stakes when match is over
    if (stakeAmount <= 0) {
      return <Text style={[styles.stakeText, { color: colors.textSecondary }]}>No stakes in this match</Text>;
    } else {
      return (
        <Text style={[styles.stakeText, { color: colors.textSecondary }]}>
          {currentMatchResult.winnerName} won ${stakeAmount.toFixed(2)}
        </Text>
      );
    }
  };
  
  // Format holes remaining text
  const holesRemainingDisplay = () => {
    if (currentMatchResult.isMatchOver || currentMatchResult.holesPlayed <= 0) return null;
    
    return (
      <Text style={[styles.holesRemainingText, { color: colors.textSecondary }]}>
        {currentMatchResult.holesRemaining} hole{currentMatchResult.holesRemaining !== 1 ? 's' : ''} remaining
      </Text>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Match Play Status</Text>
      
      {/* Match status */}
      <Text style={[
        styles.statusText, 
        { 
          color: currentMatchResult.isMatchOver ? COLORS.error : colors.textPrimary,
          fontSize: currentMatchResult.isMatchOver ? 28 : 24
        }
      ]}>
        {currentMatchResult.status || ''}
      </Text>
      
      {/* Stake display */}
      {stakeDisplay()}
      
      {/* Holes remaining display */}
      {holesRemainingDisplay()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.padding,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SIZES.base,
  },
  statusText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: SIZES.padding / 2,
    textAlign: 'center',
  },
  holesRemainingText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SIZES.padding / 2,
  },
  stakeText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SIZES.padding / 2,
  },
  strokesContainer: {
    marginTop: SIZES.base,
  },
  strokesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SIZES.base / 2,
  },
  strokesText: {
    fontSize: 14,
    marginBottom: SIZES.base / 4,
  },
  noStrokesText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  }
});

export default MatchPlayStatus; 