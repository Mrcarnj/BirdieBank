import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlayerWithTee } from '../../store/slices/playerSlice';
import { HoleScore } from '../../store/slices/roundSlice';
import { Course, Hole } from '../../store/slices/courseSlice';
import { COLORS, SIZES } from '../../constants/theme';
import { createFontStyle } from '../../utils/styleUtils';
import { useTheme } from '../../components/ThemeProvider';
import { getMatchPlayStrokesReceived } from '../../utils/handicapUtils';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface NassauStatusProps {
  players: PlayerWithTee[];
  scores: HoleScore[];
  course: Course;
  currentHole: number;
  holeRange: number[];
  courseHandicaps: Record<string, number>;
}

interface SegmentResult {
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

export default function NassauStatus({
  players,
  scores,
  course,
  currentHole,
  holeRange,
  courseHandicaps,
}: NassauStatusProps) {
  const { colors } = useTheme();
  const { selectedGames } = useSelector((state: RootState) => state.game);

  // Track final results for each segment
  const [frontNineResult, setFrontNineResult] = useState<SegmentResult | null>(null);
  const [backNineResult, setBackNineResult] = useState<SegmentResult | null>(null);
  const [overallResult, setOverallResult] = useState<SegmentResult | null>(null);

  // Get Nassau game settings and stakes
  const nassauGame = useMemo(() => {
    return selectedGames.find(game => game.type === 'nassau');
  }, [selectedGames]);

  const stakes = useMemo(() => {
    if (!nassauGame?.settings) return { front: 0, back: 0, overall: 0 };
    return {
      front: parseFloat(String(nassauGame.settings.frontNineStake)) || 0,
      back: parseFloat(String(nassauGame.settings.backNineStake)) || 0,
      overall: parseFloat(String(nassauGame.settings.overallStake)) || 0,
    };
  }, [nassauGame]);

  // Format player names as first name + last initial
  const formatPlayerName = (player: PlayerWithTee): string => {
    const nameParts = player.name.split(' ');
    const firstName = nameParts[0];
    const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0) : '';
    return `${firstName} ${lastInitial}.`;
  };

  const getHoleData = (holeNumber: number): Hole | undefined => {
    return course.holes.find(hole => hole.number === holeNumber);
  };

  // Calculate match status for a segment of holes
  const calculateSegmentStatus = (startHole: number, endHole: number): SegmentResult => {
    if (players.length !== 2) {
      return {
        status: 'Not Started',
        playerUp: null,
        holesUp: 0,
        holesPlayed: 0,
        holesRemaining: 0,
        isAllSquare: true,
        isDormie: false,
        isMatchOver: false
      };
    }

    const player1 = players[0];
    const player2 = players[1];
    const player1Name = formatPlayerName(player1);
    const player2Name = formatPlayerName(player2);
    
    let player1Up = 0;
    let holesPlayed = 0;

    // Get all holes in this segment that have been played
    const playedHoles = holeRange
      .filter(hole => hole >= startHole && hole <= endHole && hole <= currentHole)
      .sort((a, b) => a - b);

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
        player1Up++;
      } else if (player2NetScore < player1NetScore) {
        player1Up--;
      }
    });

    // Calculate holes remaining
    const totalHolesInSegment = endHole - startHole + 1;
    const holesRemaining = totalHolesInSegment - holesPlayed;

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
      // Check if match is dormie
      else if (player1Up === holesRemaining && holesRemaining > 0) {
        isDormie = true;
        status = `${player1Name} ${player1Up} UP - Dormie`;
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
        status = `${player2Name} ${player2Up} UP - Dormie`;
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
  };

  // Calculate current status for each segment
  const currentFrontNineResult = useMemo(() => calculateSegmentStatus(1, 9), [scores, currentHole, players, courseHandicaps]);
  const currentBackNineResult = useMemo(() => calculateSegmentStatus(10, 18), [scores, currentHole, players, courseHandicaps]);
  const currentOverallResult = useMemo(() => calculateSegmentStatus(1, 18), [scores, currentHole, players, courseHandicaps]);

  // Store final results when segments are won
  useEffect(() => {
    if (currentFrontNineResult.isMatchOver && !frontNineResult) {
      setFrontNineResult(currentFrontNineResult);
    }
  }, [currentFrontNineResult, frontNineResult]);

  useEffect(() => {
    if (currentBackNineResult.isMatchOver && !backNineResult) {
      setBackNineResult(currentBackNineResult);
    }
  }, [currentBackNineResult, backNineResult]);

  useEffect(() => {
    if (currentOverallResult.isMatchOver && !overallResult) {
      setOverallResult(currentOverallResult);
    }
  }, [currentOverallResult, overallResult]);

  // Calculate total winnings
  const calculateWinnings = () => {
    if (!players || players.length !== 2) return null;
    
    let totalWinnings = 0;
    const player1 = players[0];
    
    // Front nine - only count if someone won (not tied)
    if (frontNineResult?.isMatchOver) {
      if (frontNineResult.winnerName === formatPlayerName(player1)) {
        totalWinnings += stakes.front;
      } else {
        totalWinnings -= stakes.front;
      }
    }

    // Back nine - only count if someone won (not tied)
    if (backNineResult?.isMatchOver) {
      if (backNineResult.winnerName === formatPlayerName(player1)) {
        totalWinnings += stakes.back;
      } else {
        totalWinnings -= stakes.back;
      }
    }

    // Overall - only count if someone won (not tied)
    if (overallResult?.isMatchOver) {
      if (overallResult.winnerName === formatPlayerName(player1)) {
        totalWinnings += stakes.overall;
      } else {
        totalWinnings -= stakes.overall;
      }
    }

    return totalWinnings;
  };

  // Format stake display
  const stakeDisplay = useMemo(() => {
    const totalWinnings = calculateWinnings();
    if (totalWinnings === null) return null;

    // Only show stakes when ALL segments are complete (either won or tied)
    const frontComplete = frontNineResult?.isMatchOver || (currentFrontNineResult.isAllSquare && currentHole > 9);
    const backComplete = backNineResult?.isMatchOver || (currentBackNineResult.isAllSquare && currentHole > 18);
    const overallComplete = overallResult?.isMatchOver || (currentOverallResult.isAllSquare && currentHole > 18);

    if (!frontComplete || !backComplete || !overallComplete) return null;

    const player1 = players[0];
    const player2 = players[1];
    
    if (totalWinnings === 0) {
      return 'All Square - No money exchanged';
    } else if (totalWinnings > 0) {
      return `${formatPlayerName(player1)} wins $${totalWinnings.toFixed(2)}`;
    } else {
      return `${formatPlayerName(player2)} wins $${Math.abs(totalWinnings).toFixed(2)}`;
    }
  }, [frontNineResult, backNineResult, overallResult, currentFrontNineResult, currentBackNineResult, currentOverallResult, currentHole, players, stakes]);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Nassau Status</Text>
      
      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Front:</Text>
          <Text style={[
            styles.value, 
            { 
              color: frontNineResult?.isMatchOver ? COLORS.error : colors.textPrimary,
              fontSize: frontNineResult?.isMatchOver ? 16 : 14
            }
          ]}>
            {frontNineResult?.status || currentFrontNineResult.status}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Back:</Text>
          <Text style={[
            styles.value, 
            { 
              color: backNineResult?.isMatchOver ? COLORS.error : colors.textPrimary,
              fontSize: backNineResult?.isMatchOver ? 16 : 14
            }
          ]}>
            {backNineResult?.status || currentBackNineResult.status}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Overall:</Text>
          <Text style={[
            styles.value, 
            { 
              color: overallResult?.isMatchOver ? COLORS.error : colors.textPrimary,
              fontSize: overallResult?.isMatchOver ? 16 : 14
            }
          ]}>
            {overallResult?.status || currentOverallResult.status}
          </Text>
        </View>

        {stakeDisplay && (
          <Text style={[styles.stakeText, { color: colors.textSecondary }]}>
            {stakeDisplay}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SIZES.padding / 2,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding / 2,
  },
  title: {
    ...createFontStyle('bold', 14),
    marginBottom: SIZES.base / 2,
  },
  statusContainer: {
    gap: SIZES.base / 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...createFontStyle('regular', 14),
  },
  value: {
    ...createFontStyle('bold', 14),
  },
  stakeText: {
    ...createFontStyle('regular', 14),
    textAlign: 'center',
    marginTop: SIZES.base / 2,
  },
}); 