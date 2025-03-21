import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../../constants/theme';
import { PlayerWithTee } from '../../../store/slices/playerSlice';
import { Course } from '../../../store/slices/courseSlice';
import { HoleScore } from '../../../store/slices/roundSlice';
import { useTheme } from '../../ThemeProvider';

interface NassauStatusProps {
  players: PlayerWithTee[];
  scores: HoleScore[];
  course: Course;
  currentHole: number;
  holeRange: number[];
  courseHandicaps: Record<string, number>;
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

  // Calculate scores for each segment
  const calculateSegmentScore = (startHole: number, endHole: number) => {
    const segmentScores: { [playerId: string]: number } = {};
    
    scores.forEach(score => {
      if (score.holeNumber >= startHole && score.holeNumber <= endHole) {
        segmentScores[score.playerId] = (segmentScores[score.playerId] || 0) + score.strokes;
      }
    });
    
    return segmentScores;
  };

  // Calculate match status
  const calculateMatchStatus = (player1Score: number, player2Score: number) => {
    const diff = player1Score - player2Score;
    if (diff === 0) return 'AS';
    if (diff > 0) return `${diff} Up`;
    return `${Math.abs(diff)} Down`;
  };

  // Get scores for each segment
  const frontNineScores = calculateSegmentScore(1, 9);
  const backNineScores = calculateSegmentScore(10, 18);
  const overallScores = calculateSegmentScore(1, 18);

  // Calculate match statuses
  const frontNineStatus = currentHole > 9 
    ? calculateMatchStatus(frontNineScores[players[0].id] || 0, frontNineScores[players[1].id] || 0)
    : 'Not Started';
  
  const backNineStatus = currentHole >= 10
    ? calculateMatchStatus(backNineScores[players[0].id] || 0, backNineScores[players[1].id] || 0)
    : 'Not Started';
  
  const overallStatus = calculateMatchStatus(overallScores[players[0].id] || 0, overallScores[players[1].id] || 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Nassau Status</Text>
      
      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Front:</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>{frontNineStatus}</Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Back:</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>{backNineStatus}</Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Overall:</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>{overallStatus}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
  },
  title: {
    ...FONTS.h3,
    marginBottom: SIZES.base,
  },
  statusContainer: {
    gap: SIZES.base,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...FONTS.body2,
  },
  value: {
    ...FONTS.body2,
    fontWeight: 'bold',
  },
}); 