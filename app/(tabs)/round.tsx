import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { RootState, AppDispatch } from '../../store';
import { addScore, updateRound, completeRound } from '../../store/slices/roundSlice';
import { updateGameResults } from '../../store/slices/gameSlice';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Scorecard from '../../components/Scorecard';
import { FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function RoundScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentRound, isLoading } = useSelector((state: RootState) => state.round);
  const { selectedGames } = useSelector((state: RootState) => state.game);
  
  const [currentHole, setCurrentHole] = useState(1);
  const [holeRange, setHoleRange] = useState<number[]>([]);
  const [showEndRoundConfirm, setShowEndRoundConfirm] = useState(false);

  useEffect(() => {
    if (!currentRound) {
      router.replace('/(tabs)');
      return;
    }

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
    setCurrentHole(holes[0]);
  }, [currentRound]);

  const handleScoreChange = (score) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(addScore(score));
  };

  const handlePreviousHole = () => {
    const currentIndex = holeRange.indexOf(currentHole);
    if (currentIndex > 0) {
      setCurrentHole(holeRange[currentIndex - 1]);
    }
  };

  const handleNextHole = () => {
    const currentIndex = holeRange.indexOf(currentHole);
    if (currentIndex < holeRange.length - 1) {
      setCurrentHole(holeRange[currentIndex + 1]);
    } else {
      // Last hole reached
      setShowEndRoundConfirm(true);
    }
  };

  const handleEndRound = () => {
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
          { text: 'End Round', style: 'destructive', onPress: completeCurrentRound }
        ]
      );
    } else {
      completeCurrentRound();
    }
  };

  const completeCurrentRound = () => {
    if (!currentRound || !user) return;
    
    // Update game results if any
    if (selectedGames.length > 0) {
      // This is a simplified implementation
      // In a real app, you would calculate game results based on scores
      selectedGames.forEach(game => {
        const results = game.results.map(result => ({
          ...result,
          points: Math.floor(Math.random() * 10), // Random points for demo
          amount: Math.floor(Math.random() * 100), // Random amount for demo
        }));
        
        dispatch(updateGameResults({ gameId: game.id, results }));
      });
    }
    
    // Complete the round
    dispatch(completeRound(currentRound.id));
    
    // Navigate to round summary
    router.replace(`/rounds/${currentRound.id}`);
  };

  if (!currentRound) {
    return (
      <View style={styles.container}>
        <Text style={styles.noRoundText}>No active round found</Text>
        <Button
          title="Start New Round"
          onPress={() => router.replace('/(tabs)/new-round')}
          style={styles.startButton}
        />
      </View>
    );
  }

  const currentHoleData = currentRound.course?.holes.find(
    hole => hole.number === currentHole
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.courseName}>{currentRound.course?.name}</Text>
        <Text style={styles.roundDetails}>
          {currentRound.players.length} Players • {
            currentRound.holeSelection === 'front9' ? 'Front 9' :
            currentRound.holeSelection === 'back9' ? 'Back 9' :
            currentRound.holeSelection === 'full18' ? 'Full 18' : 'Custom'
          }
        </Text>
      </View>

      <Card variant="elevated" style={styles.holeCard}>
        <View style={styles.holeHeader}>
          <Text style={styles.holeTitle}>Hole {currentHole}</Text>
          <View style={styles.holeInfo}>
            <Text style={styles.holePar}>Par {currentHoleData?.par || '-'}</Text>
            <Text style={styles.holeYardage}>
              {currentRound.players[0]?.selectedTee && currentHoleData?.yardage[currentRound.players[0].selectedTee.id] || '-'} yards
            </Text>
            <Text style={styles.holeHandicap}>HCP {currentHoleData?.handicap || '-'}</Text>
          </View>
        </View>
        
        <View style={styles.holeNavigation}>
          <TouchableOpacity
            style={[
              styles.navButton,
              holeRange.indexOf(currentHole) === 0 && styles.disabledNavButton,
            ]}
            onPress={handlePreviousHole}
            disabled={holeRange.indexOf(currentHole) === 0}
          >
            <FontAwesome5 name="chevron-left" size={16} color={COLORS.textPrimary} />
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>
          
          <View style={styles.holeIndicator}>
            {holeRange.map(hole => (
              <TouchableOpacity
                key={hole}
                style={[
                  styles.holeDot,
                  hole === currentHole && styles.currentHoleDot,
                ]}
                onPress={() => setCurrentHole(hole)}
              />
            ))}
          </View>
          
          <TouchableOpacity
            style={[
              styles.navButton,
              holeRange.indexOf(currentHole) === holeRange.length - 1 && styles.endRoundButton,
            ]}
            onPress={holeRange.indexOf(currentHole) === holeRange.length - 1 ? 
              () => setShowEndRoundConfirm(true) : handleNextHole}
          >
            {holeRange.indexOf(currentHole) === holeRange.length - 1 ? (
              <Text style={styles.endRoundText}>End Round</Text>
            ) : (
              <>
                <Text style={styles.navButtonText}>Next</Text>
                <FontAwesome5 name="chevron-right" size={16} color={COLORS.textPrimary} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </Card>

      <View style={styles.scorecardContainer}>
        <Text style={styles.sectionTitle}>Scorecard</Text>
        <Scorecard
          course={currentRound.course!}
          players={currentRound.players}
          scores={currentRound.scores}
          holeRange={[currentHole]}
          onScoreChange={handleScoreChange}
        />
      </View>

      {selectedGames.length > 0 && (
        <View style={styles.gamesContainer}>
          <Text style={styles.sectionTitle}>Active Games</Text>
          {selectedGames.map(game => (
            <Card key={game.id} style={styles.gameCard}>
              <Text style={styles.gameTitle}>{
                game.type === 'nassau' ? 'Nassau' :
                game.type === 'skins' ? 'Skins' :
                game.type === 'match-play' ? 'Match Play' :
                game.type === 'stableford' ? 'Stableford' :
                game.type === 'vegas' ? 'Vegas' :
                'Wolf'
              }</Text>
              <Text style={styles.gameStake}>Stake: ${game.stake}</Text>
            </Card>
          ))}
        </View>
      )}

      <View style={styles.actionsContainer}>
        <Button
          title="View Full Scorecard"
          variant="outline"
          onPress={() => router.push('/scorecard')}
          style={styles.actionButton}
        />
        <Button
          title="End Round"
          variant="primary"
          onPress={() => setShowEndRoundConfirm(true)}
          style={styles.actionButton}
        />
      </View>

      {showEndRoundConfirm && (
        <View style={styles.confirmOverlay}>
          <Card variant="elevated" style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>End Round?</Text>
            <Text style={styles.confirmText}>
              Are you sure you want to end this round? Make sure all scores are entered.
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
                onPress={handleEndRound}
                style={styles.confirmButton}
              />
            </View>
          </Card>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SIZES.padding,
    backgroundColor: COLORS.primary,
  },
  courseName: {
    ...FONTS.h2,
    color: COLORS.secondary,
    marginBottom: SIZES.base / 2,
  },
  roundDetails: {
    ...FONTS.body3,
    color: COLORS.secondaryLight,
  },
  holeCard: {
    margin: SIZES.padding,
    backgroundColor: COLORS.secondary,
  },
  holeHeader: {
    marginBottom: SIZES.padding,
  },
  holeTitle: {
    ...FONTS.h2,
    color: COLORS.primary,
    marginBottom: SIZES.base,
  },
  holeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  holePar: {
    ...FONTS.body3,
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  holeYardage: {
    ...FONTS.body3,
    color: COLORS.textPrimary,
  },
  holeHandicap: {
    ...FONTS.body3,
    color: COLORS.textPrimary,
  },
  holeNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.base,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.base,
    borderRadius: SIZES.radius,
  },
  disabledNavButton: {
    opacity: 0.5,
  },
  endRoundButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.base * 2,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius,
  },
  navButtonText: {
    ...FONTS.body4,
    color: COLORS.textPrimary,
    marginHorizontal: SIZES.base / 2,
  },
  endRoundText: {
    ...FONTS.body4,
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  holeIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  holeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 2,
  },
  currentHoleDot: {
    backgroundColor: COLORS.primary,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  scorecardContainer: {
    padding: SIZES.padding,
    paddingTop: 0,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    marginBottom: SIZES.base,
  },
  gamesContainer: {
    padding: SIZES.padding,
    paddingTop: 0,
  },
  gameCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  gameTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  gameStake: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
  },
  actionsContainer: {
    padding: SIZES.padding,
    paddingTop: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.padding,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: SIZES.base / 2,
  },
  confirmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.transparentBlack,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  confirmCard: {
    width: '100%',
    padding: SIZES.padding,
  },
  confirmTitle: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
    marginBottom: SIZES.base,
    textAlign: 'center',
  },
  confirmText: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
    marginBottom: SIZES.padding,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmButton: {
    flex: 1,
    marginHorizontal: SIZES.base / 2,
  },
  noRoundText: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: SIZES.padding * 2,
  },
  startButton: {
    margin: SIZES.padding,
  },
}); 