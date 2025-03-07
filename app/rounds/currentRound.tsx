// This is a complete rewrite of the RoundScreen component that fixes hook ordering issues
// and navigation problems

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  StyleProp,
  ViewStyle,
  TextStyle,
  SafeAreaView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { RootState, AppDispatch } from '../../store';
import { addScore, updateRound, completeRound, HoleScore, saveRound } from '../../store/slices/roundSlice';
import { updateGameResults } from '../../store/slices/gameSlice';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Scorecard from '../../components/Scorecard';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { createFontStyle } from '../../utils/styleUtils';
import { useTheme } from '../../components/ThemeProvider';
import { getCourseHandicaps } from '../../utils/handicapUtils';

export default function RoundScreen() {
  // Hooks must be called unconditionally at the top level
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentRound, isLoading } = useSelector((state: RootState) => state.round);
  const { selectedGames } = useSelector((state: RootState) => state.game);
  const { colors } = useTheme();
  
  // Define all state variables unconditionally
  const [currentHole, setCurrentHole] = useState(1);
  const [holeRange, setHoleRange] = useState<number[]>([]);
  const [showEndRoundConfirm, setShowEndRoundConfirm] = useState(false);
  const [roundSaved, setRoundSaved] = useState(false);
  const [roundCompleted, setRoundCompleted] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigationAttempted = useRef(false);
  
  // Initialize the app
  useEffect(() => {
    if (!currentRound && !isLoading) {
      console.log("No current round and not loading");
    }
  }, [currentRound, isLoading]);

  // Setup hole range when currentRound changes
  useEffect(() => {
    if (!currentRound) return;
    
    // Determine hole range based on selection
    let holes: number[] = [];
    switch (currentRound.holeSelection) {
      case 'front9':
        holes = Array.from({ length: 9 }, (_, i) => i + 1);
        break;
      case 'back9':
        holes = Array.from({ length: 9 }, (_, i) => i + 10);
        break;
      case 'full18':
        holes = Array.from({ length: 18 }, (_, i) => i + 1);
        break;
      case 'custom':
        const startHole = currentRound.customStartHole || 1;
        holes = Array.from({ length: 18 }, (_, i) => {
          const holeNum = startHole + i;
          return holeNum > 18 ? holeNum - 18 : holeNum;
        });
        break;
    }
    
    setHoleRange(holes);
    
    // Only set the current hole if it hasn't been set yet or is invalid
    if (!currentHole || !holes.includes(currentHole)) {
      setCurrentHole(holes[0]);
    }
  }, [currentRound, currentHole]);

  // Save round if needed
  useEffect(() => {
    if (!currentRound || !user) return;
    
    // Save the round to the database if it hasn't been saved yet
    if (currentRound.id.startsWith('temp-') && !roundSaved) {
      dispatch(saveRound(currentRound))
        .unwrap()
        .then(() => {
          setRoundSaved(true);
          console.log('Round saved successfully');
        })
        .catch(error => {
          console.error('Failed to save round:', error);
          Alert.alert('Error', 'Failed to save round. Please try again.');
        });
    }
  }, [currentRound, user, dispatch, roundSaved]);

  // Safe navigation function 
  const safeNavigateHome = useCallback(() => {
    // Prevent multiple navigation attempts
    if (navigationAttempted.current) return;
    navigationAttempted.current = true;
    
    console.log("Attempting to navigate home...");
    setIsNavigating(true);
    
    // Use setTimeout to delay navigation
    setTimeout(() => {
      try {
        // Use a direct approach - navigate to tabs index
        router.push("/(tabs)");
      } catch (error) {
        console.error("Navigation error:", error);
        
        // Try alternate navigation after a delay
        setTimeout(() => {
          try {
            router.replace("/");
          } catch (err) {
            console.error("Final navigation attempt failed:", err);
            Alert.alert(
              "Navigation Error",
              "Unable to return to home screen. Please restart the app."
            );
          }
        }, 500);
      }
    }, 500);
  }, [router]);

  // Complete current round with simplified logic
  const completeCurrentRound = useCallback(() => {
    if (!currentRound || !user) return;
    console.log("Completing round...");
    
    // First ensure round is saved
    const savePromise = currentRound.id.startsWith('temp-')
      ? dispatch(saveRound(currentRound)).unwrap()
      : Promise.resolve(currentRound);
    
    savePromise
      .then(savedRound => {
        // Update game results if needed
        if (selectedGames.length > 0) {
          dispatch(updateGameResults({
            scores: currentRound.scores,
            roundId: savedRound.id
          }));
        }
        
        // Complete the round
        return dispatch(completeRound(savedRound.id)).unwrap();
      })
      .then(() => {
        console.log("Round completed successfully");
        // Show success message before navigating
        Alert.alert(
          "Round Completed",
          "Your round has been completed successfully.",
          [{ 
            text: "OK", 
            onPress: () => {
              setRoundCompleted(true);
              setShowEndRoundConfirm(false);
              safeNavigateHome();
            }
          }],
          { cancelable: false }
        );
      })
      .catch(error => {
        console.error('Failed to complete round:', error);
        Alert.alert('Error', 'Failed to complete the round. Please try again.');
      });
  }, [currentRound, user, dispatch, selectedGames, safeNavigateHome]);
  
  // Handle score changes
  const handleScoreChange = useCallback((score: HoleScore) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(addScore(score));
  }, [dispatch]);

  // Handle navigation to previous hole
  const handlePreviousHole = useCallback(() => {
    const currentIndex = holeRange.indexOf(currentHole);
    if (currentIndex > 0) {
      setCurrentHole(holeRange[currentIndex - 1]);
    }
  }, [currentHole, holeRange]);

  // Handle navigation to next hole
  const handleNextHole = useCallback(() => {
    const currentIndex = holeRange.indexOf(currentHole);
    if (currentIndex < holeRange.length - 1) {
      setCurrentHole(holeRange[currentIndex + 1]);
    } else {
      // Last hole reached
      setShowEndRoundConfirm(true);
    }
  }, [currentHole, holeRange]);

  // Handle end round button press
  const handleEndRound = useCallback(() => {
    if (!currentRound) return;
    
    // Check if all scores are entered
    const totalScoresNeeded = currentRound.players.length * holeRange.length;
    const scoresEntered = currentRound.scores.filter(score => 
      holeRange.includes(score.holeNumber)
    ).length;
    
    if (scoresEntered < totalScoresNeeded) {
      Alert.alert(
        'Incomplete Scorecard',
        `You've only entered ${scoresEntered} out of ${totalScoresNeeded} scores. Are you sure you want to end the round?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'End Round', 
            style: 'destructive', 
            onPress: completeCurrentRound 
          }
        ]
      );
    } else {
      completeCurrentRound();
    }
  }, [currentRound, holeRange, completeCurrentRound]);

  // Get current hole data
  const currentHoleData = useMemo(() => {
    if (!currentRound?.course?.holes) return null;
    return currentRound.course.holes.find(
      hole => hole.number === currentHole
    );
  }, [currentRound, currentHole]);

  // Get tee yardages for current hole
  const teeYardages = useMemo(() => {
    if (!currentRound?.course?.holes || !currentHoleData) return [];
    
    // Get unique tees being played
    const uniqueTees = currentRound.players
      .filter(player => player.selectedTee)
      .map(player => player.selectedTee!)
      .filter((tee, index, self) => 
        index === self.findIndex(t => t.id === tee.id)
      );
    
    // Get yardage for each tee
    const yardages = uniqueTees.map(tee => ({
      tee,
      yardage: currentHoleData.yardage[tee.id] || 0
    }));
    
    // Sort by yardage (longest first)
    return yardages.sort((a, b) => b.yardage - a.yardage);
  }, [currentRound, currentHoleData]);

  // Calculate course handicaps
  const courseHandicaps = useMemo(() => {
    if (currentRound?.courseHandicaps) {
      return currentRound.courseHandicaps;
    }
    
    if (currentRound?.players) {
      return getCourseHandicaps(currentRound.players);
    }
    
    return {};
  }, [currentRound]);

  // Show loading screen if navigating away
  if (isNavigating || roundCompleted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.noRoundText, { color: colors.textPrimary }]}>Returning to home screen...</Text>
      </View>
    );
  }

  // If no current round, show a message
  if (!currentRound) {
    return (
      <View style={{ ...styles.container, backgroundColor: colors.background }}>
        <Text style={{ ...styles.noRoundText, color: colors.textPrimary }}>No active round found</Text>
        <Button
          title="Start New Round"
          onPress={() => router.navigate('/(tabs)/new-round')}
          style={styles.startButton}
        />
      </View>
    );
  }

  // Main render of the round screen
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ ...styles.container, backgroundColor: colors.background }}>
        <Card style={{ ...styles.holeCard, backgroundColor: colors.card, marginTop: 0 }}>
          <View style={styles.holeHeader}>
            <View>
              <Text style={[styles.holeTitle, { color: colors.textPrimary }]}>Hole {currentHole}</Text>
              <View style={styles.holeDetails}>
                <Text style={[styles.holePar, { color: colors.textSecondary }]}>Par {currentHoleData?.par || '-'}</Text>
                <Text style={[styles.holeHandicap, { color: colors.textSecondary }]}>HCP {currentHoleData?.handicap || '-'}</Text>
              </View>
            </View>
            
            {/* Tee yardages */}
            <View style={styles.teeYardages}>
              {teeYardages.map(({ tee, yardage }) => (
                <View key={tee.id} style={styles.teeYardageRow}>
                  <View 
                    style={[
                      styles.teeColorIndicator, 
                      { backgroundColor: tee.color || colors.primary }
                    ]} 
                  />
                  <Text style={[styles.teeYardageText, { color: colors.textSecondary }]}>
                    {yardage} yards
                  </Text>
                </View>
              ))}
            </View>
          </View>
          
          <View style={styles.holeNavigation}>
            <TouchableOpacity
              style={[
                styles.navButton,
                holeRange.indexOf(currentHole) === 0 ? styles.disabledNavButton : {},
                { backgroundColor: colors.secondaryLight }
              ]}
              onPress={handlePreviousHole}
              disabled={holeRange.indexOf(currentHole) === 0}
            >
              <FontAwesome5 name="chevron-left" size={16} color={colors.textPrimary} />
              <Text style={[styles.navButtonText, { color: colors.textPrimary }]}>Previous</Text>
            </TouchableOpacity>
            
            <View style={styles.holeIndicator}>
              {holeRange.map(hole => (
                <TouchableOpacity
                  key={hole}
                  style={[
                    styles.holeDot,
                    hole === currentHole ? styles.currentHoleDot : {},
                    { 
                      backgroundColor: hole === currentHole ? colors.primary : colors.secondaryLight,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => setCurrentHole(hole)}
                />
              ))}
            </View>
            
            <TouchableOpacity
              style={[
                styles.navButton,
                holeRange.indexOf(currentHole) === holeRange.length - 1 ? styles.lastHoleNavButton : {},
                { backgroundColor: colors.secondaryLight }
              ]}
              onPress={handleNextHole}
            >
              <Text style={[styles.navButtonText, { color: colors.textPrimary }]}>
                {holeRange.indexOf(currentHole) === holeRange.length - 1 ? 'Finish' : 'Next'}
              </Text>
              <FontAwesome5 
                name={holeRange.indexOf(currentHole) === holeRange.length - 1 ? 'flag-checkered' : 'chevron-right'} 
                size={16} 
                color={colors.textPrimary} 
              />
            </TouchableOpacity>
          </View>
        </Card>
        
        <View style={styles.scorecardContainer}>
          <Scorecard
            course={currentRound!.course!}
            players={currentRound!.players}
            scores={currentRound!.scores}
            holeRange={[currentHole]} // Just show the current hole
            editable={true}
            onScoreChange={handleScoreChange}
            courseHandicaps={courseHandicaps}
          />
        </View>
        
        <View style={styles.actionButtons}>
          <Button
            title="End Round"
            variant="outline"
            onPress={() => setShowEndRoundConfirm(true)}
            style={styles.endRoundButton}
          />
          
          <Button
            title="View Scorecard"
            onPress={() => {
              router.push({
                pathname: `/rounds/${currentRound!.id}/scorecard`,
                params: { roundId: currentRound!.id }
              } as any);
            }}
          />
        </View>
        
        {/* End Round Confirmation Modal */}
        <Modal
          visible={showEndRoundConfirm}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <Card style={{ ...styles.confirmModal, backgroundColor: colors.card }}>
              <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>End Round?</Text>
              <Text style={[styles.confirmText, { color: colors.textSecondary }]}>
                Are you sure you want to end this round? This action cannot be undone.
              </Text>
              
              <View style={styles.confirmButtons}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowEndRoundConfirm(false)}
                  style={styles.confirmButton}
                />
                <Button
                  title="End Round"
                  onPress={() => {
                    setShowEndRoundConfirm(false);
                    handleEndRound();
                  }}
                  style={styles.confirmButton}
                />
              </View>
            </Card>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.padding,
  } as ViewStyle,
  holeCard: {
    marginBottom: SIZES.padding,
    padding: SIZES.padding,
  } as ViewStyle,
  holeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  } as ViewStyle,
  holeTitle: {
    ...FONTS.h2,
  } as TextStyle,
  holeDetails: {
    flexDirection: 'row',
  } as ViewStyle,
  holePar: {
    ...FONTS.body3,
    marginRight: SIZES.base,
  } as TextStyle,
  holeHandicap: {
    ...FONTS.body3,
  } as TextStyle,
  holeNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.padding,
  } as ViewStyle,
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.base,
    borderRadius: SIZES.radius,
  } as ViewStyle,
  disabledNavButton: {
    opacity: 0.5,
  } as ViewStyle,
  lastHoleNavButton: {
    backgroundColor: COLORS.primary + '20',
  } as ViewStyle,
  navButtonText: {
    ...FONTS.body3,
    marginHorizontal: SIZES.base / 2,
  } as TextStyle,
  holeIndicator: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    flexWrap: 'wrap',
  } as ViewStyle,
  holeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    margin: 2,
    borderWidth: 1,
  } as ViewStyle,
  currentHoleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  } as ViewStyle,
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: SIZES.padding,
  } as ViewStyle,
  endRoundButton: {
    marginRight: SIZES.base,
  } as ViewStyle,
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  confirmModal: {
    width: '80%',
    padding: SIZES.padding,
  } as ViewStyle,
  confirmTitle: {
    ...FONTS.h2,
    marginBottom: SIZES.base,
    textAlign: 'center',
  } as TextStyle,
  confirmText: {
    ...FONTS.body3,
    marginBottom: SIZES.padding,
    textAlign: 'center',
  } as TextStyle,
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  confirmButton: {
    flex: 1,
    marginHorizontal: SIZES.base / 2,
  } as ViewStyle,
  noRoundText: {
    ...FONTS.h3,
    textAlign: 'center',
    marginTop: SIZES.padding * 2,
  } as TextStyle,
  startButton: {
    margin: SIZES.padding,
  } as ViewStyle,
  teeYardages: {
    alignItems: 'flex-end',
  } as ViewStyle,
  teeYardageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  } as ViewStyle,
  teeColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SIZES.base,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  } as ViewStyle,
  teeYardageText: {
    ...FONTS.body3,
    fontSize: 14,
  } as TextStyle,
  scorecardContainer: {
    width: '100%',
  } as ViewStyle,
});