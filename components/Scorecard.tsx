import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import * as Haptics from 'expo-haptics';
import { Course, Hole } from '../store/slices/courseSlice';
import { PlayerWithTee } from '../store/slices/playerSlice';
import { HoleScore } from '../store/slices/roundSlice';
import { getStrokesReceivedOnHole, calculateNetScore } from '../utils/handicapUtils';

interface ScorecardProps {
  course: Course;
  players: PlayerWithTee[];
  scores: HoleScore[];
  holeRange: number[]; // Array of hole numbers to display
  editable?: boolean;
  onScoreChange?: (score: HoleScore) => void;
  courseHandicaps?: Record<string, number>; // Add courseHandicaps prop
}

const Scorecard: React.FC<ScorecardProps> = ({
  course,
  players,
  scores,
  holeRange,
  editable = true,
  onScoreChange,
  courseHandicaps = {}, // Default to empty object
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
    
    if (strokes < par - 1) return COLORS.warning; // Eagle or better
    if (strokes === par - 1) return COLORS.error; // Birdie
    if (strokes === par) return COLORS.textPrimary; // Par
    if (strokes === par + 1) return COLORS.textPrimary; // Bogey
    return COLORS.textPrimary; // Double bogey or worse
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

  const calculateNetTotalScore = (playerId: string): number | undefined => {
    const grossTotal = calculateTotalScore(playerId);
    if (grossTotal === 0) return undefined;
    
    // Calculate total strokes received
    const totalStrokesReceived = holeRange.reduce((total, holeNumber) => {
      return total + getStrokesReceived(playerId, holeNumber);
    }, 0);
    
    if (totalStrokesReceived === 0) return undefined;
    
    return grossTotal - totalStrokesReceived;
  };

  const calculateTotalPar = (): number => {
    return holeRange.reduce((total, holeNumber) => {
      const hole = getHoleData(holeNumber);
      return total + (hole?.par || 0);
    }, 0);
  };

  // Calculate score relative to par
  const calculateScoreToPar = (playerId: string): number => {
    const totalScore = calculateTotalScore(playerId);
    const totalPar = calculateTotalPar();
    
    // Only calculate if we have scores
    if (totalScore === 0) return 0;
    
    return totalScore - totalPar;
  };

  // Calculate net score relative to par
  const calculateNetScoreToPar = (playerId: string): number | undefined => {
    const netTotal = calculateNetTotalScore(playerId);
    if (netTotal === undefined) return undefined;
    
    const totalPar = calculateTotalPar();
    return netTotal - totalPar;
  };

  // Format score to par for display (E, +1, -2, etc.)
  const formatScoreToPar = (scoreToPar: number): string => {
    if (scoreToPar === 0) return 'E';
    return scoreToPar > 0 ? `+${scoreToPar}` : `${scoreToPar}`;
  };

  // Get color for score to par
  const getScoreToParColor = (scoreToPar: number): string => {
    if (scoreToPar < 0) return COLORS.error; // Under par (negative) is red
    if (scoreToPar > 0) return COLORS.textPrimary; // Over par is normal text color
    return COLORS.textPrimary; // Even par is normal text color
  };

  // Function to determine if a player receives strokes on a hole
  const getStrokesReceived = (playerId: string, holeNumber: number): number => {
    const hole = getHoleData(holeNumber);
    if (!hole || !courseHandicaps[playerId]) return 0;
    
    // Get the stroke index (handicap) of the hole
    // Use only hole.handicap since strokeIndex doesn't exist on the Hole type
    const strokeIndex = hole.handicap || 0;
    
    // Get the player's course handicap
    const courseHandicap = courseHandicaps[playerId] || 0;
    
    // Calculate strokes received
    return getStrokesReceivedOnHole(courseHandicap, strokeIndex);
  };

  // Function to calculate net score
  const getNetScore = (playerId: string, holeNumber: number): number | undefined => {
    const grossScore = getPlayerScore(playerId, holeNumber);
    if (grossScore === undefined) return undefined;
    
    const strokesReceived = getStrokesReceived(playerId, holeNumber);
    if (strokesReceived === 0) return undefined; // Only return net if strokes received
    
    return calculateNetScore(grossScore, strokesReceived);
  };

  // Calculate cumulative score to par up to a specific hole
  const getCumulativeScoreToPar = (playerId: string, upToHoleIndex: number): number => {
    // Get all scores for this player
    const playerScores = scores.filter(score => 
      score.playerId === playerId
    );
    
    // If no scores entered, return 0 (even)
    if (playerScores.length === 0) return 0;
    
    let cumulativePar = 0;
    let cumulativeScore = 0;
    
    // Process all holes that have been played (have scores)
    for (const score of playerScores) {
      const hole = getHoleData(score.holeNumber);
      if (hole) {
        cumulativePar += hole.par;
        cumulativeScore += score.strokes;
      }
    }
    
    return cumulativeScore - cumulativePar;
  };

  // Calculate cumulative net score to par up to a specific hole
  const getCumulativeNetScoreToPar = (playerId: string, upToHoleIndex: number): number | undefined => {
    // First check if player has a course handicap
    const playerHandicap = courseHandicaps[playerId];
    if (!playerHandicap || playerHandicap <= 0) return undefined;
    
    // Get all scores for this player
    const playerScores = scores.filter(score => 
      score.playerId === playerId
    );
    
    // If no scores entered at all, return undefined
    if (playerScores.length === 0) return undefined;
    
    let cumulativePar = 0;
    let cumulativeScore = 0;
    let cumulativeStrokesReceived = 0;
    
    // Process all holes that have been played (have scores)
    for (const score of playerScores) {
      const hole = getHoleData(score.holeNumber);
      if (hole) {
        cumulativePar += hole.par;
        cumulativeScore += score.strokes;
        cumulativeStrokesReceived += getStrokesReceived(playerId, score.holeNumber);
      }
    }
    
    // Calculate net score to par based on played holes
    const netScoreToPar = (cumulativeScore - cumulativeStrokesReceived) - cumulativePar;
    return netScoreToPar;
  };

  // Get the score indicator component based on relation to par
  const getScoreIndicator = (score: number | undefined, par: number, children: React.ReactNode): React.ReactNode => {
    if (score === undefined) return children;
    
    if (score < par - 1) {
      // Eagle or better: Double circle
      return (
        <View style={styles.doubleCircleContainer}>
          <View style={styles.outerCircle}>
            <View style={styles.innerCircle}>
              {children}
            </View>
          </View>
        </View>
      );
    } else if (score === par - 1) {
      // Birdie: Single circle
      return (
        <View style={styles.circleContainer}>
          <View style={styles.circle}>
            {children}
          </View>
        </View>
      );
    } else if (score === par) {
      // Par: No indicator
      return children;
    } else if (score === par + 1) {
      // Bogey: Single square
      return (
        <View style={styles.squareContainer}>
          <View style={styles.square}>
            {children}
          </View>
        </View>
      );
    } else {
      // Double bogey or worse: Double square
      return (
        <View style={styles.doubleSquareContainer}>
          <View style={styles.outerSquare}>
            <View style={styles.innerSquare}>
              {children}
            </View>
          </View>
        </View>
      );
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        {/* Header Row */}
        <View style={styles.row}>
          <View style={styles.playerCell}>
            <Text style={styles.headerText}>Player</Text>
          </View>
          {holeRange.map(holeNumber => (
            <View key={`hole-${holeNumber}`} style={styles.holeCell}>
              <Text style={styles.headerText}>Score</Text>
              <Text style={styles.parText}>
                Par {getHoleData(holeNumber)?.par || '-'}
              </Text>
            </View>
          ))}
          <View style={[styles.totalCell, styles.totalHeaderCell]}>
            <Text style={styles.headerText}>Total</Text>
          </View>
        </View>
        
        {/* Player Rows */}
        {players.map(player => (
          <View key={player.id} style={styles.row}>
            {/* Player Cell */}
            <View style={styles.playerCell}>
              <View style={styles.playerNameContainer}>
                <Text style={styles.playerName}>{player.name}</Text>
                {courseHandicaps[player.id] !== undefined && (
                  <Text style={styles.handicapText}> ({courseHandicaps[player.id]})</Text>
                )}
              </View>
              <View style={styles.teeContainer}>
                <View 
                  style={[
                    styles.teeColorDot, 
                    { backgroundColor: player.selectedTee?.color || COLORS.primary }
                  ]} 
                />
                <Text style={styles.teeText}>
                  {player.selectedTee?.name || 'No tee'}
                </Text>
              </View>
            </View>
            
            {/* Score Cells */}
            {holeRange.map((holeNumber, index) => {
              const score = getPlayerScore(player.id, holeNumber);
              const par = getHoleData(holeNumber)?.par || 0;
              const isActive = activeCell?.playerId === player.id && activeCell?.holeNumber === holeNumber;
              const strokesReceived = getStrokesReceived(player.id, holeNumber);
              const netScore = getNetScore(player.id, holeNumber);
              
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
                  {strokesReceived > 0 && (
                    <View style={styles.strokesContainer}>
                      {[...Array(strokesReceived)].map((_, i) => (
                        <View key={i} style={styles.strokeDot} />
                      ))}
                    </View>
                  )}
                  
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
                    <View style={styles.scoreTextContainer}>
                      {score !== undefined ? (
                        getScoreIndicator(
                          score, 
                          par,
                          <Text
                            style={[
                              styles.scoreText,
                              { color: getScoreColor(score, par) },
                            ]}
                          >
                            {score}
                          </Text>
                        )
                      ) : (
                        <Text
                          style={[
                            styles.scoreText,
                            { color: getScoreColor(score, par) },
                          ]}
                        >
                          {'-'}
                        </Text>
                      )}
                    
                      {netScore !== undefined && score !== undefined && (
                        <Text style={styles.netScoreText}>
                          ({netScore})
                        </Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
            
            {/* Total Cell */}
            <View style={styles.totalCell}>
              <Text 
                style={[
                  styles.totalScoreText,
                  { color: getScoreToParColor(getCumulativeScoreToPar(player.id, holeRange.length - 1)) }
                ]}
              >
                {formatScoreToPar(getCumulativeScoreToPar(player.id, holeRange.length - 1))}
              </Text>
              {getCumulativeNetScoreToPar(player.id, holeRange.length - 1) !== undefined && (
                <Text 
                  style={[
                    styles.netTotalScoreText,
                    { color: getScoreToParColor(getCumulativeNetScoreToPar(player.id, holeRange.length - 1)!) }
                  ]}
                >
                  ({formatScoreToPar(getCumulativeNetScoreToPar(player.id, holeRange.length - 1)!)})
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
  },
  container: {
    width: '100%',
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: SIZES.base,
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    width: '100%',
  },
  playerCell: {
    flex: 1,
    padding: SIZES.base / 2,
    justifyContent: 'center',
    backgroundColor: COLORS.secondaryLight,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    minWidth: 120,
  },
  holeCell: {
    width: 45,
    padding: SIZES.base / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondaryLight,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  scoreCell: {
    width: 45,
    height: 50,
    padding: SIZES.base / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    position: 'relative', // Add this for absolute positioning of stroke dots
  },
  activeScoreCell: {
    backgroundColor: COLORS.secondaryLight,
  },
  totalCell: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  totalHeaderCell: {
    backgroundColor: COLORS.secondaryLight,
  },
  headerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  parText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  playerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  playerName: {
    fontWeight: 'bold',
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  handicapText: {
    fontStyle: 'italic',
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  teeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teeColorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  teeText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  scoreTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%', // Take full height of the cell
    position: 'relative', // For absolute positioning of net score
    paddingTop: 0, // Reset padding
    marginTop: -8, // Move everything up
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  scoreInput: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  totalScoreText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  netTotalScoreText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  strokesContainer: {
    position: 'absolute',
    top: 2,
    right: 2,
    flexDirection: 'row',
  },
  strokeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginLeft: 2,
  },
  netScoreText: {
    fontSize: 10,
    color: COLORS.primary,
    fontStyle: 'italic',
    position: 'absolute',
    bottom: -4, // Position below the score
  },
  // Score indicator styles
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2, // Move up slightly
  },
  circle: {
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doubleCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2, // Move up slightly
  },
  outerCircle: {
    borderWidth: 1,
    borderColor: COLORS.warning,
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    borderWidth: 1,
    borderColor: COLORS.warning,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2, // Move up slightly
  },
  square: {
    borderWidth: 1,
    borderColor: COLORS.textPrimary,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doubleSquareContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2, // Move up slightly
  },
  outerSquare: {
    borderWidth: 1,
    borderColor: COLORS.textPrimary,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerSquare: {
    borderWidth: 1,
    borderColor: COLORS.textPrimary,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Scorecard; 