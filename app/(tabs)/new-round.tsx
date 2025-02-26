import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { FONTS, SIZES } from '../../constants/theme';
import { RootState, AppDispatch } from '../../store';
import { Course, fetchCourses, fetchNearbyCourses, selectCourse, Tee } from '../../store/slices/courseSlice';
import { fetchPlayers, selectPlayer, addGuestPlayer, Player, PlayerWithTee } from '../../store/slices/playerSlice';
import { startNewRound } from '../../store/slices/roundSlice';
import { selectGame } from '../../store/slices/gameSlice';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { createFontStyle } from '../../utils/styleUtils';
import { useTheme } from '../../components/ThemeProvider';

// Find the GAME_TYPES array and add an icon property to each game type
const GAME_TYPES = [
  { type: 'nassau', name: 'Nassau', description: 'Front 9, Back 9, Total 18', icon: 'flag' },
  { type: 'skins', name: 'Skins', description: 'Each hole is worth a set amount', icon: 'dollar-sign' },
  { type: 'match-play', name: 'Match Play', description: 'Win, lose, or halve each hole', icon: 'trophy' },
  { type: 'stableford', name: 'Stableford', description: 'Points based on score relative to par', icon: 'chart-bar' },
  { type: 'vegas', name: 'Vegas', description: 'Team game with special scoring', icon: 'dice' },
  { type: 'wolf', name: 'Wolf', description: 'Players take turns being the "Wolf"', icon: 'paw' },
];

export default function NewRoundScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { courses, nearbyCourses, selectedCourse } = useSelector((state: RootState) => state.course);
  const { players, selectedPlayers } = useSelector((state: RootState) => state.player);
  const { availableGames, selectedGames } = useSelector((state: RootState) => state.game);
  const { colors, shadows } = useTheme();
  
  const [step, setStep] = useState(1);
  const [holeSelection, setHoleSelection] = useState<'front9' | 'back9' | 'full18' | 'custom'>('full18');
  const [customStartHole, setCustomStartHole] = useState(1);
  const [locationPermission, setLocationPermission] = useState(false);

  useEffect(() => {
    if (user) {
      dispatch(fetchCourses());
      dispatch(fetchPlayers(user.id));
      checkLocationPermission();
    }
  }, [user]);

  const checkLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === 'granted');
    
    if (status === 'granted') {
      dispatch(fetchNearbyCourses());
    }
  };

  const handleCourseSelect = (course: Course) => {
    dispatch(selectCourse(course));
    setStep(2);
  };

  const handlePlayerSelect = (player: Player, tee: Tee | null) => {
    dispatch(selectPlayer({ player, tee }));
  };

  const handleAddGuestPlayer = () => {
    // Simple implementation - in a real app, you'd have a modal for name input
    const guestName = `Guest ${players.filter(p => p.isGuest).length + 1}`;
    dispatch(addGuestPlayer({ name: guestName }));
  };

  const handleGameSelect = (gameType: string) => {
    const game = availableGames.find(g => g.type === gameType);
    if (game && selectedPlayers.length > 0) {
      dispatch(selectGame({
        type: game.type,
        players: selectedPlayers,
        stake: 1, // Default stake amount
      }));
    }
  };

  const handleStartRound = () => {
    if (!selectedCourse) {
      Alert.alert('Error', 'Please select a course');
      return;
    }

    if (selectedPlayers.length === 0) {
      Alert.alert('Error', 'Please select at least one player');
      return;
    }

    dispatch(startNewRound({
      course: selectedCourse,
      players: selectedPlayers,
      holeSelection,
      customStartHole: holeSelection === 'custom' ? customStartHole : undefined,
      userId: user?.id || '',
    }));

    router.replace('/rounds/currentRound');
  };

  const renderCourseSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Select a Course</Text>
      
      {locationPermission && nearbyCourses.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Nearby Courses</Text>
          {nearbyCourses.map(course => (
            <Card
              key={course.id}
              onPress={() => handleCourseSelect(course)}
              style={styles.courseCard}
            >
              <View style={styles.courseHeader}>
                <Text style={[styles.courseName, { color: colors.textPrimary }]}>{course.name}</Text>
                <FontAwesome5 name="map-marker-alt" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.courseDetails, { color: colors.textSecondary }]}>
                {course.holes.length} holes • {course.tees.length} tee options
              </Text>
            </Card>
          ))}
        </View>
      )}
      
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>All Courses</Text>
        {courses.map(course => (
          <Card
            key={course.id}
            onPress={() => handleCourseSelect(course)}
            style={styles.courseCard}
          >
            <View style={styles.courseHeader}>
              <Text style={[styles.courseName, { color: colors.textPrimary }]}>{course.name}</Text>
            </View>
            <Text style={[styles.courseDetails, { color: colors.textSecondary }]}>
              {course.holes.length} holes • {course.tees.length} tee options
            </Text>
          </Card>
        ))}
      </View>
    </View>
  );

  const renderPlayerSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Select Players</Text>
      
      {selectedCourse && (
        <Card style={styles.selectedCourseCard}>
          <View style={styles.selectedCourseHeader}>
            <Text style={[styles.selectedCourseName, { color: colors.textPrimary }]}>{selectedCourse.name}</Text>
            <TouchableOpacity onPress={() => setStep(1)}>
              <Text style={[styles.changeText, { color: colors.primary }]}>Change</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.selectedCourseDetails, { color: colors.textSecondary }]}>
            {selectedCourse.holes.length} holes • {selectedCourse.tees.length} tee options
          </Text>
        </Card>
      )}
      
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Players</Text>
          <Button 
            title="Add Guest" 
            size="small"
            variant="outline"
            onPress={handleAddGuestPlayer}
          />
        </View>
        
        {players.map(player => {
          const isSelected = selectedPlayers.some(p => p.id === player.id);
          return (
            <Card
              key={player.id}
              style={{
                ...styles.playerCard,
                ...(isSelected ? { borderColor: colors.primary, borderWidth: 2 } : {})
              }}
              onPress={() => handlePlayerSelect(player, selectedCourse?.tees[0] || null)}
            >
              <View style={styles.playerInfo}>
                <View style={[styles.playerAvatar, { backgroundColor: isSelected ? colors.primary : colors.secondaryLight }]}>
                  <Text style={[styles.playerInitial, { color: isSelected ? colors.textLight : colors.primary }]}>
                    {player.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.playerDetails}>
                  <Text style={[styles.playerName, { color: colors.textPrimary }]}>{player.name}</Text>
                  {player.handicapIndex !== undefined && (
                    <Text style={[styles.playerHandicap, { color: colors.textSecondary }]}>
                      Handicap: {player.handicapIndex < 0 ? '+' : ''}{Math.abs(player.handicapIndex).toFixed(1)}
                    </Text>
                  )}
                </View>
              </View>
              {isSelected && selectedCourse && (
                <View style={styles.teeSelection}>
                  <Text style={[styles.teeLabel, { color: colors.textSecondary }]}>Tee:</Text>
                  <View style={styles.teeOptions}>
                    {selectedCourse.tees.map(tee => {
                      const selectedPlayerTee = selectedPlayers.find(p => p.id === player.id)?.selectedTee;
                      const isTeeSelected = selectedPlayerTee?.id === tee.id;
                      return (
                        <TouchableOpacity
                          key={tee.id}
                          style={[
                            styles.teeOption,
                            { backgroundColor: isTeeSelected ? colors.primary : colors.secondaryLight }
                          ]}
                          onPress={() => handlePlayerSelect(player, tee)}
                        >
                          <Text style={[
                            styles.teeText,
                            { color: isTeeSelected ? colors.textLight : colors.textPrimary }
                          ]}>
                            {tee.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </Card>
          );
        })}
      </View>
      
      <View style={styles.holeSelectionContainer}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Hole Selection</Text>
        <View style={styles.holeOptions}>
          <TouchableOpacity
            style={[
              styles.holeOption,
              holeSelection === 'front9' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setHoleSelection('front9')}
          >
            <Text style={[
              styles.holeOptionText,
              { color: holeSelection === 'front9' ? colors.textLight : colors.textPrimary }
            ]}>
              Front 9
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.holeOption,
              holeSelection === 'back9' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setHoleSelection('back9')}
          >
            <Text style={[
              styles.holeOptionText,
              { color: holeSelection === 'back9' ? colors.textLight : colors.textPrimary }
            ]}>
              Back 9
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.holeOption,
              holeSelection === 'full18' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setHoleSelection('full18')}
          >
            <Text style={[
              styles.holeOptionText,
              { color: holeSelection === 'full18' ? colors.textLight : colors.textPrimary }
            ]}>
              Full 18
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.holeOption,
              holeSelection === 'custom' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setHoleSelection('custom')}
          >
            <Text style={[
              styles.holeOptionText,
              { color: holeSelection === 'custom' ? colors.textLight : colors.textPrimary }
            ]}>
              Custom
            </Text>
          </TouchableOpacity>
        </View>
        
        {holeSelection === 'custom' && (
          <View style={styles.customHoleContainer}>
            <Text style={[styles.customHoleLabel, { color: colors.textSecondary }]}>Starting Hole:</Text>
            <TextInput
              style={[styles.customHoleInput, { 
                color: colors.textPrimary,
                borderColor: colors.border,
                backgroundColor: colors.card
              }]}
              value={customStartHole.toString()}
              onChangeText={(text) => {
                const hole = parseInt(text);
                if (!isNaN(hole) && hole >= 1 && hole <= 18) {
                  setCustomStartHole(hole);
                }
              }}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
        )}
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Back"
          variant="outline"
          onPress={() => setStep(1)}
          style={styles.backButton}
        />
        <Button
          title="Next"
          onPress={() => setStep(3)}
          disabled={selectedPlayers.length === 0}
        />
      </View>
    </View>
  );

  const renderGameSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Game Options</Text>
      
      <Card style={styles.summaryCard}>
        <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Round Summary</Text>
        
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Course:</Text>
          <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{selectedCourse?.name}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Players:</Text>
          <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{selectedPlayers.length}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Holes:</Text>
          <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
            {holeSelection === 'front9' ? 'Front 9' :
             holeSelection === 'back9' ? 'Back 9' :
             holeSelection === 'full18' ? 'Full 18' :
             `Custom (Starting at hole ${customStartHole})`}
          </Text>
        </View>
      </Card>
      
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Select Game Type (Optional)</Text>
        <View style={styles.gameGrid}>
          {GAME_TYPES.map(game => {
            const isSelected = selectedGames.some(g => g.type === game.type);
            return (
              <TouchableOpacity
                key={game.type}
                style={[
                  styles.gameCard,
                  { backgroundColor: isSelected ? colors.primary : colors.card },
                  isSelected ? {} : { borderColor: colors.border, borderWidth: 1 }
                ]}
                onPress={() => handleGameSelect(game.type)}
              >
                <FontAwesome5
                  name={game.icon}
                  size={24}
                  color={isSelected ? colors.textLight : colors.primary}
                  style={styles.gameIcon}
                />
                <Text style={[
                  styles.gameName,
                  { color: isSelected ? colors.textLight : colors.textPrimary }
                ]}>
                  {game.name}
                </Text>
                <Text style={[
                  styles.gameDescription,
                  { color: isSelected ? colors.textLight + 'DD' : colors.textSecondary }
                ]}>
                  {game.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Back"
          variant="outline"
          onPress={() => setStep(2)}
          style={styles.backButton}
        />
        <Button
          title="Start Round"
          onPress={handleStartRound}
        />
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.stepIndicator, { backgroundColor: colors.card, ...shadows.light }]}>
        <View
          style={[
            styles.stepDot,
            { 
              backgroundColor: step >= 1 ? colors.primary : colors.secondaryLight,
              borderColor: colors.border
            }
          ]}
        >
          <Text style={[styles.stepNumber, { color: step >= 1 ? colors.textLight : colors.textPrimary }]}>1</Text>
        </View>
        <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
        <View
          style={[
            styles.stepDot,
            { 
              backgroundColor: step >= 2 ? colors.primary : colors.secondaryLight,
              borderColor: colors.border
            }
          ]}
        >
          <Text style={[styles.stepNumber, { color: step >= 2 ? colors.textLight : colors.textPrimary }]}>2</Text>
        </View>
        <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
        <View
          style={[
            styles.stepDot,
            { 
              backgroundColor: step >= 3 ? colors.primary : colors.secondaryLight,
              borderColor: colors.border
            }
          ]}
        >
          <Text style={[styles.stepNumber, { color: step >= 3 ? colors.textLight : colors.textPrimary }]}>3</Text>
        </View>
      </View>

      {step === 1 && renderCourseSelection()}
      {step === 2 && renderPlayerSelection()}
      {step === 3 && renderGameSelection()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.padding,
    paddingTop: SIZES.padding / 2,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    ...createFontStyle(FONTS.h2),
    marginBottom: SIZES.padding,
  },
  sectionContainer: {
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    ...createFontStyle(FONTS.h3),
    marginBottom: SIZES.base * 1.5,
  },
  courseCard: {
    marginBottom: SIZES.base * 1.5,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  courseName: {
    ...createFontStyle(FONTS.h4),
  },
  courseDetails: {
    ...createFontStyle(FONTS.body4),
  },
  selectedCourseCard: {
    marginBottom: SIZES.padding,
  },
  selectedCourseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  selectedCourseName: {
    ...createFontStyle(FONTS.h4),
  },
  selectedCourseDetails: {
    ...createFontStyle(FONTS.body4),
  },
  changeText: {
    ...createFontStyle(FONTS.body4),
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base * 1.5,
  },
  playerCard: {
    marginBottom: SIZES.base * 1.5,
    padding: SIZES.padding / 1.5,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.base * 1.5,
  },
  playerInitial: {
    ...createFontStyle(FONTS.h3),
    fontWeight: 'bold',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    ...createFontStyle(FONTS.h4),
    marginBottom: 2,
  },
  playerHandicap: {
    ...createFontStyle(FONTS.body5),
  },
  teeSelection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.base * 1.5,
    paddingTop: SIZES.base,
  },
  teeLabel: {
    ...createFontStyle(FONTS.body4),
    marginRight: SIZES.base,
  },
  teeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  teeOption: {
    paddingHorizontal: SIZES.base,
    paddingVertical: SIZES.base / 2,
    borderRadius: SIZES.radius / 2,
    marginRight: SIZES.base,
    marginBottom: SIZES.base / 2,
  },
  teeText: {
    ...createFontStyle(FONTS.body5),
    fontWeight: '500',
  },
  holeSelectionContainer: {
    marginBottom: SIZES.padding,
  },
  holeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SIZES.base,
  },
  holeOption: {
    paddingHorizontal: SIZES.padding / 2,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius / 2,
    marginRight: SIZES.base,
    marginBottom: SIZES.base,
  },
  holeOptionText: {
    ...createFontStyle(FONTS.body4),
    fontWeight: '500',
  },
  customHoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.base,
  },
  customHoleLabel: {
    ...createFontStyle(FONTS.body4),
    marginRight: SIZES.base,
  },
  customHoleInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderRadius: SIZES.radius / 2,
    paddingHorizontal: SIZES.base,
    textAlign: 'center',
    ...createFontStyle(FONTS.body4),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.padding,
  },
  backButton: {
    width: '48%',
  },
  summaryCard: {
    marginBottom: SIZES.padding,
  },
  summaryTitle: {
    ...createFontStyle(FONTS.h3),
    marginBottom: SIZES.base * 1.5,
  },
  summaryItem: {
    flexDirection: 'row',
    marginBottom: SIZES.base,
  },
  summaryLabel: {
    ...createFontStyle(FONTS.body4),
    width: 80,
  },
  summaryValue: {
    ...createFontStyle(FONTS.body4),
    flex: 1,
    fontWeight: '500',
  },
  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gameCard: {
    width: '48%',
    borderRadius: SIZES.radius,
    padding: SIZES.padding / 1.5,
    marginBottom: SIZES.base * 2,
    alignItems: 'center',
  },
  gameIcon: {
    marginBottom: SIZES.base,
  },
  gameName: {
    ...createFontStyle(FONTS.h4),
    marginBottom: 4,
    textAlign: 'center',
  },
  gameDescription: {
    ...createFontStyle(FONTS.body5),
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.padding * 2,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: SIZES.base,
  },
  stepNumber: {
    ...createFontStyle(FONTS.body4),
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 