import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import * as Haptics from 'expo-haptics';
import { Course, Hole } from '../store/slices/courseSlice';
import { PlayerWithTee } from '../store/slices/playerSlice';
import { HoleScore } from '../store/slices/roundSlice';

interface ScorecardProps {
  course: Course;
  players: PlayerWithTee[];
  scores: HoleScore[];
  holeRange: number[]; // Array of hole numbers to display
  editable?: boolean;
  onScoreChange?: (score: HoleScore) => void;
}

const Scorecard: React.FC<ScorecardProps> = ({
  course,
  players,
  scores,
  holeRange,
  editable = true,
  onScoreChange,
}) => {
  const [activeCell, setActiveCell] = useState<{
    playerId: string;
    holeNumber: number;
  } | null>(null);

  const getHoleData = (holeNumber: number): Hole | undefined => {
    return course.holes.find(hole => hole.number === holeNumber);
  };

  const getPlayerScore = (playerId: string, holeNumber: number): number | undefined => {
    const score = scores.find(
      s => s.playerId === playerId && s.holeNumber === holeNumber
    );
    return score?.strokes;
  };

  const getScoreColor = (strokes: number | undefined, par: number): string => {
    if (strokes === undefined) return COLORS.textSecondary;
    
    if (strokes < par - 1) return COLORS.info; // Eagle or better
    if (strokes === par - 1) return COLORS.success; // Birdie
    if (strokes === par) return COLORS.textPrimary; // Par
    if (strokes === par + 1) return COLORS.warning; // Bogey
    return COLORS.error; // Double bogey or worse
  };

  const handleScorePress = (playerId: string, holeNumber: number) => {
    if (!editable) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCell({ playerId, holeNumber });
  };

  const handleScoreChange = (value: string, playerId: string, holeNumber: number) => {
    const numValue = parseInt(value);
    
    if (isNaN(numValue) || numValue < 1) return;
    
    if (onScoreChange) {
      onScoreChange({
        playerId,
        holeNumber,
        strokes: numValue,
      });
    }
    
    setActiveCell(null);
  };

  const calculateTotalScore = (playerId: string): number => {
    return scores
      .filter(score => score.playerId === playerId && holeRange.includes(score.holeNumber))
      .reduce((total, score) => total + score.strokes, 0);
  };

  const calculateTotalPar = (): number => {
    return holeRange
      .map(holeNumber => getHoleData(holeNumber)?.par || 0)
      .reduce((total, par) => total + par, 0);
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Header Row */}
        <View style={styles.row}>
          <View style={styles.playerCell}>
            <Text style={styles.headerText}>Player</Text>
          </View>
          {holeRange.map(holeNumber => (
            <View key={`hole-${holeNumber}`} style={styles.holeCell}>
              <Text style={styles.headerText}>{holeNumber}</Text>
              <Text style={styles.parText}>
                {getHoleData(holeNumber)?.par || '-'}
              </Text>
            </View>
          ))}
          <View style={styles.totalCell}>
            <Text style={styles.headerText}>Total</Text>
            <Text style={styles.parText}>{calculateTotalPar()}</Text>
          </View>
        </View>

        {/* Player Rows */}
        {players.map(player => (
          <View key={player.id} style={styles.row}>
            <View style={styles.playerCell}>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.teeText}>
                {player.selectedTee?.name || 'No tee'}
              </Text>
            </View>
            
            {holeRange.map(holeNumber => {
              const score = getPlayerScore(player.id, holeNumber);
              const par = getHoleData(holeNumber)?.par || 0;
              const isActive = activeCell?.playerId === player.id && activeCell?.holeNumber === holeNumber;
              
              return (
                <TouchableOpacity
                  key={`score-${player.id}-${holeNumber}`}
                  style={[
                    styles.scoreCell,
                    isActive && styles.activeScoreCell,
                  ]}
                  onPress={() => handleScorePress(player.id, holeNumber)}
                  disabled={!editable}
                >
                  {isActive ? (
                    <TextInput
                      style={styles.scoreInput}
                      keyboardType="number-pad"
                      defaultValue={score?.toString() || ''}
                      autoFocus
                      selectTextOnFocus
                      maxLength={2}
                      onBlur={() => setActiveCell(null)}
                      onChangeText={(value) => handleScoreChange(value, player.id, holeNumber)}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.scoreText,
                        { color: getScoreColor(score, par) },
                      ]}
                    >
                      {score || '-'}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
            
            <View style={styles.totalCell}>
              <Text style={styles.totalText}>{calculateTotalScore(player.id)}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: SIZES.base,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  playerCell: {
    width: 100,
    padding: SIZES.base,
    justifyContent: 'center',
    backgroundColor: COLORS.secondaryLight,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  holeCell: {
    width: 50,
    padding: SIZES.base,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondaryLight,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  scoreCell: {
    width: 50,
    height: 60,
    padding: SIZES.base,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  activeScoreCell: {
    backgroundColor: COLORS.secondaryLight,
  },
  totalCell: {
    width: 70,
    padding: SIZES.base,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  headerText: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  parText: {
    ...FONTS.body5,
    color: COLORS.textSecondary,
  },
  playerName: {
    ...FONTS.h5,
    color: COLORS.textPrimary,
  },
  teeText: {
    ...FONTS.body5,
    color: COLORS.textSecondary,
  },
  scoreText: {
    ...FONTS.body3,
    fontWeight: 'bold',
  },
  scoreInput: {
    ...FONTS.body3,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  totalText: {
    ...FONTS.h3,
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
});

export default Scorecard; 