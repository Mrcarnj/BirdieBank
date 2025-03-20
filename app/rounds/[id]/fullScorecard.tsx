import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  ViewStyle,
  TextStyle
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';

import { COLORS, FONTS, SIZES, SHADOWS } from '../../../constants/theme';
import { RootState, AppDispatch } from '../../../store';
import { Round, HoleScore } from '../../../store/slices/roundSlice';
import { Course, Hole } from '../../../store/slices/courseSlice';
import { useTheme } from '../../../components/ThemeProvider';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import { getStrokesReceivedOnHole, getCourseHandicaps } from '../../../utils/handicapUtils';

interface ScorecardProps {
  round: Round;
}

const ScorecardScreen = () => {
  const params = useLocalSearchParams();
  const roundId = params.roundId as string;
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { colors } = useTheme();
  
  // Get the current round from redux state
  const { currentRound, pastRounds } = useSelector((state: RootState) => state.round);
  
  // Use the round ID to determine which round to display
  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Get the round either from currentRound or past rounds
    if (currentRound && currentRound.id === roundId) {
      setRound(currentRound);
      setLoading(false);
    } else {
      const pastRound = pastRounds?.find((r: Round) => r.id === roundId);
      if (pastRound) {
        setRound(pastRound);
        setLoading(false);
      } else {
        // If we don't have the round data, we could fetch it here
        setLoading(false);
      }
    }
  }, [roundId, currentRound, pastRounds]);
  
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  if (!round || !round.course) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.textPrimary }}>Round not found</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          style={{ marginTop: SIZES.padding }}
        />
      </View>
    );
  }
  
  // With the round data, render the scorecard
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen 
        options={{
          title: 'Scorecard',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 0 }}
      >
        <Card style={{ marginBottom: SIZES.base, padding: SIZES.base, backgroundColor: colors.card }}>
          <View style={styles.roundInfo}>
            <Text style={[styles.courseName, { color: colors.textPrimary }]}>{round.course.name}</Text>
            <Text style={[styles.roundDate, { color: colors.textSecondary }]}>
              {new Date(round.date).toLocaleDateString()}
            </Text>
          </View>
        </Card>
        
        {/* Full Scorecard Display */}
        <FullScorecard round={round} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Component to display the full scorecard with front 9, back 9, and totals
const FullScorecard = ({ round }: ScorecardProps) => {
  const { colors } = useTheme();
  
  // Parse the course data to get holes - remove courseHandicaps from destructuring
  const { course, players, scores } = round;
  
  // Calculate course handicaps using the same approach as in currentRound.tsx
  const effectiveCourseHandicaps = useMemo(() => {
    // Log the round data for debugging
    console.log("====== ROUND DATA DEBUG ======");
    console.log("Round ID:", round.id);
    console.log("Course Handicaps from round:", JSON.stringify(round.courseHandicaps));
    
    // First try to use round.courseHandicaps if available
    if (round.courseHandicaps) {
      console.log("Using courseHandicaps from round data");
      return round.courseHandicaps;
    }
    
    // If not available, calculate handicaps from player data
    if (players) {
      console.log("Calculating courseHandicaps from player data");
      const calculatedHandicaps = getCourseHandicaps(players);
      console.log("Calculated handicaps:", JSON.stringify(calculatedHandicaps));
      return calculatedHandicaps;
    }
    
    console.log("No handicap data available, returning empty object");
    console.log("============================");
    return {};
  }, [round, players]);
  
  // Create arrays for front 9, back 9, and all 18 holes
  const front9 = Array.from({ length: 9 }, (_, i) => i + 1);
  const back9 = Array.from({ length: 9 }, (_, i) => i + 10);
  const allHoles = [...front9, ...back9];
  
  // Debug function to log which holes each player gets strokes on
  useEffect(() => {
    console.log("====== HANDICAP STROKES DEBUG ======");
    players.forEach(player => {
      const playerId = player.id;
      // Use the calculated handicaps
      const playerHandicap = effectiveCourseHandicaps[playerId] || 0;
      if (playerHandicap <= 0) {
        console.log(`Player ${player.name} has no handicap (${playerHandicap})`);
        return;
      }
      
      console.log(`Player ${player.name} has course handicap: ${playerHandicap}`);
      
      // Find which holes the player gets strokes on
      const strokeHoles = allHoles.filter(holeNumber => {
        const hole = course?.holes?.find(h => h.number === holeNumber);
        if (!hole || !hole.handicap) return false;
        
        // Use getStrokesReceivedOnHole to check if player gets strokes on this hole
        const strokesReceived = getStrokesReceivedOnHole(playerHandicap, hole.handicap);
        return strokesReceived > 0;
      });
      
      console.log(`Player ${player.name} gets strokes on holes: ${strokeHoles.join(', ')}`);
      
      // Log each hole's handicap index for reference
      allHoles.forEach(holeNumber => {
        const hole = course?.holes?.find(h => h.number === holeNumber);
        if (hole && hole.handicap) {
          console.log(`Hole ${holeNumber} has handicap index: ${hole.handicap}`);
        }
      });
    });
    console.log("====================================");
  }, [round, players, course, effectiveCourseHandicaps]);
  
  // Helper function to get hole data
  const getHoleData = (holeNumber: number): Hole | undefined => {
    return course?.holes?.find(hole => hole.number === holeNumber);
  };
  
  // Helper function to get player score for a hole
  const getPlayerScore = (playerId: string, holeNumber: number): number | undefined => {
    const score = scores.find(
      s => s.playerId === playerId && s.holeNumber === holeNumber
    );
    return score?.strokes;
  };
  
  // Helper function to calculate net score (gross score minus strokes received)
  const getNetScore = (playerId: string, holeNumber: number): number | undefined => {
    const grossScore = getPlayerScore(playerId, holeNumber);
    if (grossScore === undefined) return undefined;
    
    const strokesReceived = getStrokesReceived(playerId, holeNumber);
    return grossScore - strokesReceived;
  };
  
  // Helper function to calculate net total score for a range of holes
  const calculateNetTotalScore = (playerId: string, holeRange: number[]): number => {
    let total = 0;
    let validScores = 0;
    
    holeRange.forEach(holeNumber => {
      const netScore = getNetScore(playerId, holeNumber);
      if (netScore !== undefined) {
        total += netScore;
        validScores++;
      }
    });
    
    return validScores > 0 ? total : 0;
  };
  
  // Helper function to get strokes received for a player on a specific hole
  const getStrokesReceived = (playerId: string, holeNumber: number): number => {
    const player = players.find(p => p.id === playerId);
    if (!player) return 0;
    
    // Use the calculated handicaps from the useMemo hook
    const courseHandicap = effectiveCourseHandicaps[playerId] || 0;
    if (courseHandicap <= 0) return 0;
    
    const hole = getHoleData(holeNumber);
    if (!hole || !hole.handicap) return 0;
    
    // Get the stroke index (handicap index)
    // NOTE: In golf handicapping, lower numbers are more difficult holes
    // Hole 6 with handicap index 6 means it's the 6th most difficult hole
    const strokeIndex = hole.handicap;
    
    // Special debug for hole 6
    if (holeNumber === 6) {
      // Detailed calculation steps for debugging
      const fullCycles = Math.floor((courseHandicap - 1) / 18);
      const remainingStrokes = courseHandicap - (fullCycles * 18);
      const baseStrokes = strokeIndex <= remainingStrokes ? 1 : 0;
      const totalStrokes = baseStrokes + fullCycles;
      
      console.log(`
        ===== HOLE 6 DETAILED DEBUG =====
        Player: ${player.name}
        Course Handicap: ${courseHandicap}
        Hole 6 Stroke Index: ${strokeIndex}
        Full Cycles: ${fullCycles}
        Remaining Strokes: ${remainingStrokes}
        Gets Base Stroke: ${baseStrokes === 1 ? 'YES' : 'NO'} (Is ${strokeIndex} <= ${remainingStrokes}?)
        Additional Strokes from Cycles: ${fullCycles}
        TOTAL STROKES RECEIVED: ${totalStrokes}
        ==============================
      `);
      
      // Return value from handicapUtils for consistency
      return getStrokesReceivedOnHole(courseHandicap, strokeIndex);
    }
    
    // Use the imported function from handicapUtils.ts which implements the standard golf allocation method
    // This function handles the correct calculation of strokes received based on hole stroke index
    // and player's course handicap
    return getStrokesReceivedOnHole(courseHandicap, strokeIndex);
  };
  
  // Calculate totals
  const calculateTotalScore = (playerId: string, holeRange: number[]): number => {
    let total = 0;
    let validScores = 0;
    
    holeRange.forEach(holeNumber => {
      const score = getPlayerScore(playerId, holeNumber);
      if (score !== undefined) {
        total += score;
        validScores++;
      }
    });
    
    return validScores > 0 ? total : 0;
  };
  
  // Calculate total par for a range of holes
  const calculateTotalPar = (holeRange: number[]): number => {
    let total = 0;
    
    holeRange.forEach(holeNumber => {
      const hole = getHoleData(holeNumber);
      if (hole) {
        total += hole.par;
      }
    });
    
    return total;
  };
  
  // Helper function to check if total score is under par
  const isTotalUnderPar = (playerId: string, holeRange: number[]): boolean => {
    const totalScore = calculateTotalScore(playerId, holeRange);
    const totalPar = calculateTotalPar(holeRange);
    return totalScore < totalPar && totalScore > 0; // Ensure score is valid and under par
  };
  
  // Helper function to check if net total score is under par
  const isNetTotalUnderPar = (playerId: string, holeRange: number[]): boolean => {
    const netTotalScore = calculateNetTotalScore(playerId, holeRange);
    const totalPar = calculateTotalPar(holeRange);
    return netTotalScore < totalPar && netTotalScore > 0; // Ensure score is valid and under par
  };
  
  // Helper function to determine style based on score relative to par
  const getScoreStyle = (score: number | undefined, par: number): ViewStyle => {
    if (score === undefined) return {};
    
    const scoreToPar = score - par;
    
    if (scoreToPar <= -2) return { backgroundColor: '#FFD700', borderRadius: 15 }; // Eagle or better: Yellow circle
    if (scoreToPar === -1) return { backgroundColor: '#FF0000', borderRadius: 15 }; // Birdie: Red circle
    if (scoreToPar === 0) return {}; // Par: default background
    if (scoreToPar === 1) return { backgroundColor: '#000000' }; // Bogey: Black square
    if (scoreToPar >= 2) return { backgroundColor: '#0000FF' }; // Double bogey or worse: Blue square
    
    return {};
  };
  
  // Helper function to determine text style based on score relative to par
  const getScoreTextStyle = (score: number | undefined, par: number): TextStyle => {
    if (score === undefined) return { color: colors.textPrimary };
    
    const scoreToPar = score - par;
    
    // Set text color to white for red, black and blue backgrounds
    if (scoreToPar === -1 || scoreToPar === 1 || scoreToPar >= 2) {
      return { color: '#ffffff' };
    }
    
    // Eagle or better (yellow background) gets black text
    if (scoreToPar <= -2) {
      return { color: '#000000' };
    }
    
    return { color: colors.textPrimary };
  };
  
  return (
    <View style={styles.scorecardContainer}>
      {/* Unified Scorecard */}
      <View style={[styles.scorecardSection, { backgroundColor: colors.card, borderWidth: 1, borderColor: 'black' }]}>
        {/* Hole numbers row */}
        <View style={styles.row}>
          <View style={styles.holeHeader}>
            <Text style={[styles.headerText, { color: colors.textSecondary }]}>Hole</Text>
          </View>
          {front9.map(holeNumber => (
            <View key={`hole-${holeNumber}`} style={[styles.holeCell, { backgroundColor: colors.primary }]}>
              <Text style={[styles.headerText, { color: colors.textLight }]}>{holeNumber}</Text>
            </View>
          ))}
          <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
            <Text style={[styles.headerText, { color: colors.textSecondary }]}>Out</Text>
          </View>
        </View>
        
        {/* Par row */}
        <View style={styles.row}>
          <View style={styles.holeHeader}>
            <Text style={[styles.headerText, { color: colors.textSecondary }]}>Par</Text>
          </View>
          {front9.map(holeNumber => {
            const hole = getHoleData(holeNumber);
            return (
              <View key={`par-${holeNumber}`} style={styles.holeCell}>
                <Text style={[styles.parText, { color: colors.textSecondary }]}>
                  {hole?.par || '-'}
                </Text>
              </View>
            );
          })}
          <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
            <Text style={[styles.parText, { color: colors.textSecondary }]}>
              {calculateTotalPar(front9)}
            </Text>
          </View>
        </View>
        
        {/* Player scores for front 9 */}
        {players.map(player => (
          <React.Fragment key={`front9-${player.id}`}>
            {/* Gross Score Row */}
            <View style={styles.row}>
              <View style={styles.playerCell}>
                <Text style={[styles.playerName, { color: colors.textPrimary }]}>
                  Gross
                </Text>
              </View>
              
              {front9.map(holeNumber => {
                const score = getPlayerScore(player.id, holeNumber);
                const hole = getHoleData(holeNumber);
                const par = hole?.par || 0;
                const strokesReceived = getStrokesReceived(player.id, holeNumber);
                
                return (
                  <View 
                    key={`score-${player.id}-${holeNumber}`} 
                    style={[
                      styles.scoreCell,
                      getScoreStyle(score, par)
                    ]}
                  >
                    <Text style={[styles.scoreText, getScoreTextStyle(score, par)]}>
                      {score !== undefined ? score : '-'}
                    </Text>
                    
                    {strokesReceived > 0 && (
                      <View style={styles.strokeDot} />
                    )}
                  </View>
                );
              })}
              
              <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
                <Text style={[styles.totalScoreText, { color: colors.textPrimary }]}>
                  {calculateTotalScore(player.id, front9)}
                </Text>
              </View>
            </View>
            
            {/* Net Score Row */}
            <View style={styles.row}>
              <View style={styles.playerCell}>
                <Text style={[styles.playerName, { color: colors.textPrimary }]}>
                  Net
                </Text>
              </View>
              
              {front9.map(holeNumber => {
                const netScore = getNetScore(player.id, holeNumber);
                const hole = getHoleData(holeNumber);
                const par = hole?.par || 0;
                const strokesReceived = getStrokesReceived(player.id, holeNumber);
                
                return (
                  <View 
                    key={`net-${player.id}-${holeNumber}`} 
                    style={[
                      styles.scoreCell,
                      getScoreStyle(netScore, par)
                    ]}
                  >
                    <Text style={[styles.scoreText, getScoreTextStyle(netScore, par)]}>
                      {netScore !== undefined ? netScore : '-'}
                    </Text>
                  </View>
                );
              })}
              
              <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
                <Text style={[styles.totalScoreText, { color: colors.textPrimary }]}>
                  {calculateNetTotalScore(player.id, front9)}
                </Text>
              </View>
            </View>
          </React.Fragment>
        ))}
        
        {/* Back 9 Holes Section */}
        {/* Hole numbers row */}
        <View style={styles.row}>
          <View style={styles.holeHeader}>
            <Text style={[styles.headerText, { color: colors.textSecondary }]}>Hole</Text>
          </View>
          {back9.map(holeNumber => (
            <View key={`hole-${holeNumber}`} style={[styles.holeCell, { backgroundColor: colors.primary }]}>
              <Text style={[styles.headerText, { color: colors.textLight }]}>{holeNumber}</Text>
            </View>
          ))}
          <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
            <Text style={[styles.headerText, { color: colors.textSecondary }]}>In</Text>
          </View>
          <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
            <Text style={[styles.headerText, { color: colors.textSecondary }]}>Tot</Text>
          </View>
        </View>
        
        {/* Par row */}
        <View style={styles.row}>
          <View style={styles.holeHeader}>
            <Text style={[styles.headerText, { color: colors.textSecondary }]}>Par</Text>
          </View>
          {back9.map(holeNumber => {
            const hole = getHoleData(holeNumber);
            return (
              <View key={`par-${holeNumber}`} style={styles.holeCell}>
                <Text style={[styles.parText, { color: colors.textSecondary }]}>
                  {hole?.par || '-'}
                </Text>
              </View>
            );
          })}
          <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
            <Text style={[styles.parText, { color: colors.textSecondary }]}>
              {calculateTotalPar(back9)}
            </Text>
          </View>
          <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
            <Text style={[styles.parText, { color: colors.textSecondary }]}>
              {calculateTotalPar(allHoles)}
            </Text>
          </View>
        </View>
        
        {/* Player scores for back 9 */}
        {players.map(player => (
          <React.Fragment key={`back9-${player.id}`}>
            {/* Gross Score Row */}
            <View style={styles.row}>
              <View style={styles.playerCell}>
                <Text style={[styles.playerName, { color: colors.textPrimary }]}>
                  Gross
                </Text>
              </View>
              
              {back9.map(holeNumber => {
                const score = getPlayerScore(player.id, holeNumber);
                const hole = getHoleData(holeNumber);
                const par = hole?.par || 0;
                const strokesReceived = getStrokesReceived(player.id, holeNumber);
                
                return (
                  <View 
                    key={`score-${player.id}-${holeNumber}`} 
                    style={[
                      styles.scoreCell,
                      getScoreStyle(score, par)
                    ]}
                  >
                    <Text style={[styles.scoreText, getScoreTextStyle(score, par)]}>
                      {score !== undefined ? score : '-'}
                    </Text>
                    
                    {strokesReceived > 0 && (
                      <View style={styles.strokeDot} />
                    )}
                  </View>
                );
              })}
              
              <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
                <Text style={[styles.totalScoreText, { color: colors.textPrimary }]}>
                  {calculateTotalScore(player.id, back9)}
                </Text>
              </View>
              <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
                {isTotalUnderPar(player.id, [...front9, ...back9]) ? (
                  <Text style={[styles.totalScoreText, { color: '#FF0000' }]}>
                    {calculateTotalScore(player.id, [...front9, ...back9])}
                  </Text>
                ) : (
                  <Text style={[styles.totalScoreText, { color: '#FFFFFF' }]}>
                    {calculateTotalScore(player.id, [...front9, ...back9])}
                  </Text>
                )}
              </View>
            </View>
            
            {/* Net Score Row */}
            <View style={styles.row}>
              <View style={styles.playerCell}>
                <Text style={[styles.playerName, { color: colors.textPrimary }]}>
                  Net
                </Text>
              </View>
              
              {back9.map(holeNumber => {
                const netScore = getNetScore(player.id, holeNumber);
                const hole = getHoleData(holeNumber);
                const par = hole?.par || 0;
                
                return (
                  <View 
                    key={`net-${player.id}-${holeNumber}`} 
                    style={[
                      styles.scoreCell,
                      getScoreStyle(netScore, par)
                    ]}
                  >
                    <Text style={[styles.scoreText, getScoreTextStyle(netScore, par)]}>
                      {netScore !== undefined ? netScore : '-'}
                    </Text>
                  </View>
                );
              })}
              
              <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
                <Text style={[styles.totalScoreText, { color: colors.textPrimary }]}>
                  {calculateNetTotalScore(player.id, back9)}
                </Text>
              </View>
              <View style={[styles.totalCell, { backgroundColor: colors.secondaryLight }]}>
                {isNetTotalUnderPar(player.id, [...front9, ...back9]) ? (
                  <Text style={[styles.totalScoreText, { color: '#FF0000' }]}>
                    {calculateNetTotalScore(player.id, [...front9, ...back9])}
                  </Text>
                ) : (
                  <Text style={[styles.totalScoreText, { color: '#FFFFFF' }]}>
                    {calculateNetTotalScore(player.id, [...front9, ...back9])}
                  </Text>
                )}
              </View>
            </View>
          </React.Fragment>
        ))}
      </View>
      
      {/* Legend */}
      <View style={[styles.legendContainer, { backgroundColor: colors.card, marginTop: SIZES.base, borderWidth: 1, borderColor: 'black' }]}>
        <Text style={[styles.legendTitle, { color: colors.textPrimary, textAlign: 'center' }]}>Score Legend</Text>
        
        {/* First row: Eagle or better, Birdie, Par */}
        <View style={styles.legendRowContainer}>
          <View style={styles.legendRowItem}>
            <View style={[styles.legendItem, styles.eagleOrBetter]}>
              <Text style={[styles.legendText, { color: '#000' }]}>3</Text>
            </View>
            <Text style={[styles.legendDescription, { color: colors.textSecondary }]}>Eagle or better</Text>
          </View>
          
          <View style={styles.legendRowItem}>
            <View style={[styles.legendItem, styles.birdie]}>
              <Text style={[styles.legendText, { color: '#FFF' }]}>3</Text>
            </View>
            <Text style={[styles.legendDescription, { color: colors.textSecondary }]}>Birdie</Text>
          </View>
          
          <View style={styles.legendRowItem}>
            <View style={[styles.legendItem]}>
              <Text style={[styles.legendText, { color: colors.textPrimary }]}>4</Text>
            </View>
            <Text style={[styles.legendDescription, { color: colors.textSecondary }]}>Par</Text>
          </View>
        </View>
        
        {/* Second row: Bogey, Double Bogey, Stroke */}
        <View style={styles.legendRowContainer}>
          <View style={styles.legendRowItem}>
            <View style={[styles.legendItem, styles.bogey]}>
              <Text style={[styles.legendText, { color: '#FFF' }]}>5</Text>
            </View>
            <Text style={[styles.legendDescription, { color: colors.textSecondary }]}>Bogey</Text>
          </View>
          
          <View style={styles.legendRowItem}>
            <View style={[styles.legendItem, styles.doubleBogeyOrWorse]}>
              <Text style={[styles.legendText, { color: '#FFF' }]}>6</Text>
            </View>
            <Text style={[styles.legendDescription, { color: colors.textSecondary }]}>Double bogey+</Text>
          </View>
          
          <View style={styles.legendRowItem}>
            <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
              <Text style={{ fontSize: 11, color: colors.textPrimary }}>4</Text>
              <View style={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: 'black',
                borderWidth: 1,
                borderColor: 'white'
              }} />
            </View>
            <Text style={[styles.legendDescription, { color: colors.textSecondary }]}>Stroke received</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scorecardContainer: {
    flex: 1,
    padding: 2,
    width: '100%',  // Ensure it takes full width
  },
  scorecardSection: {
    marginBottom: SIZES.base,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    width: '100%',  // Ensure scorecard section takes full width
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    width: '100%',  // Ensure rows take full width
  },
  holeHeader: {
    width: 44,
    padding: 2,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  playerCell: {
    width: 44,
    padding: 2,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  holeCell: {
    width: 32,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  scoreCell: {
    width: 32,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    position: 'relative',
  },
  totalCell: {
    width: 32,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryLight,
  },
  headerText: {
    fontSize: 11,
    fontWeight: 'bold' as const,
  },
  playerName: {
    fontSize: 11,
    fontWeight: 'bold' as const,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: 'bold' as const,
  },
  parText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  totalScoreText: {
    fontSize: 12,
    fontWeight: 'bold' as const,
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  roundDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  roundInfo: {
    marginBottom: SIZES.padding,
  },
  eagle: {
    backgroundColor: '#4CAF50', // Green for eagle
    borderRadius: 0, // Square
  },
  birdie: {
    backgroundColor: '#FF0000', // Red for birdie
    borderRadius: 15, // Circle
  },
  par: {
    backgroundColor: '#FFFFFF', // White for par
    borderRadius: 0, // Square
  },
  bogey: {
    backgroundColor: '#000000', // Black for bogey
    borderRadius: 0, // Square
  },
  doubleBogeyOrWorse: {
    backgroundColor: '#2196F3', // Blue for double bogey or worse
    borderRadius: 0, // Square
  },
  strokeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'black',
    borderWidth: 1,
    borderColor: 'white',
  },
  eagleOrBetter: {
    backgroundColor: '#FFD700', // Yellow for eagle or better
    borderRadius: 15, // Make it round
  },
  legendContainer: {
    padding: 8,
    borderRadius: SIZES.radius,
    marginTop: SIZES.base,
    alignSelf: 'center',  // Center the legend horizontally
    width: 'auto',        // Only take up necessary width
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 'bold' as const,
    marginBottom: 6,
    textAlign: 'center',
  },
  legendRowContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6,
  },
  legendRowItem: {
    flexDirection: 'column',
    alignItems: 'center',
    width: 100,
    marginHorizontal: 4,
  },
  legendItem: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  legendText: {
    fontSize: 11,
    fontWeight: 'bold' as const,
  },
  legendDescription: {
    fontSize: 10,
    textAlign: 'center',
  },
});

export default ScorecardScreen; 