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
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { RootState, AppDispatch } from '../../store';
import { Course, fetchCourses, fetchNearbyCourses, selectCourse, Tee } from '../../store/slices/courseSlice';
import { fetchPlayers, selectPlayer, addGuestPlayer, Player } from '../../store/slices/playerSlice';
import { startNewRound } from '../../store/slices/roundSlice';
import { selectGame } from '../../store/slices/gameSlice';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { createFontStyle } from '../../utils/styleUtils';

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
    <View style={styles.stepContainer as any}>
      <Text style={styles.stepTitle as any}>Select a Course</Text>
      
      {locationPermission && nearbyCourses.length > 0 && (
        <View style={styles.sectionContainer as any}>
          <Text style={styles.sectionTitle as any}>Nearby Courses</Text>
          {nearbyCourses.map(course => (
            <Card
              key={course.id}
              onPress={() => handleCourseSelect(course)}
              style={styles.courseCard as any}
            >
              <View style={styles.courseHeader as any}>
                <Text style={styles.courseName as any}>{course.name}</Text>
                <FontAwesome5 name="map-marker-alt" size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.courseDetails as any}>
                {course.holes.length} holes • {course.tees.length} tee options
              </Text>
            </Card>
          ))}
        </View>
      )}
      
      <View style={styles.sectionContainer as any}>
        <Text style={styles.sectionTitle as any}>All Courses</Text>
        {courses.map(course => (
          <Card
            key={course.id}
            onPress={() => handleCourseSelect(course)}
            style={styles.courseCard as any}
          >
            <View style={styles.courseHeader as any}>
              <Text style={styles.courseName as any}>{course.name}</Text>
            </View>
            <Text style={styles.courseDetails as any}>
              {course.holes.length} holes • {course.tees.length} tee options
            </Text>
          </Card>
        ))}
      </View>
    </View>
  );

  const renderPlayerSelection = () => (
    <View style={styles.stepContainer as any}>
      <Text style={styles.stepTitle as any}>Select Players</Text>
      
      <View style={styles.sectionContainer as any}>
        <View style={styles.sectionHeader as any}>
          <Text style={styles.sectionTitle as any}>Your Players</Text>
          <Button
            title="Add Guest"
            variant="outline"
            size="small"
            onPress={handleAddGuestPlayer}
          />
        </View>
        
        {players.map(player => {
          const isSelected = selectedPlayers.some(p => p.id === player.id);
          return (
            <Card
              key={player.id}
              style={[
                styles.playerCard as any,
                isSelected && styles.selectedPlayerCard as any,
              ] as any}
              onPress={() => handlePlayerSelect(player, null)}
            >
              <View style={styles.playerInfo as any}>
                <Text style={styles.playerName as any}>{player.name}</Text>
                {player.handicapIndex !== undefined && (
                  <Text style={styles.playerHandicap as any}>
                    Handicap: {player.handicapIndex}
                  </Text>
                )}
              </View>
              {isSelected && (
                <FontAwesome5 name="check-circle" size={20} color={COLORS.primary} />
              )}
            </Card>
          );
        })}
      </View>
      
      {selectedPlayers.length > 0 && (
        <View style={styles.sectionContainer as any}>
          <Text style={styles.sectionTitle as any}>Selected Players</Text>
          {selectedPlayers.map(player => (
            <Card key={player.id} style={styles.selectedDetailCard as any}>
              <View style={styles.playerInfo as any}>
                <Text style={styles.playerName as any}>{player.name}</Text>
              </View>
              <View style={styles.teeSelection as any}>
                <Text style={styles.teeLabel as any}>Tee:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {selectedCourse?.tees.map(tee => (
                    <TouchableOpacity
                      key={tee.id}
                      style={[
                        styles.teeOption as any,
                        player.selectedTee?.id === tee.id && styles.selectedTeeOption as any,
                        { backgroundColor: tee.color },
                      ]}
                      onPress={() => handlePlayerSelect(player, tee)}
                    >
                      <Text style={styles.teeName as any}>{tee.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </Card>
          ))}
        </View>
      )}
      
      <View style={styles.navigationButtons as any}>
        <Button
          title="Back"
          variant="outline"
          onPress={() => setStep(1)}
          style={styles.navigationButton as any}
        />
        <Button
          title="Next"
          onPress={() => setStep(3)}
          style={styles.navigationButton as any}
          disabled={selectedPlayers.length === 0}
        />
      </View>
    </View>
  );

  const renderGameSelection = () => (
    <View style={styles.stepContainer as any}>
      <Text style={styles.stepTitle as any}>Select Games</Text>
      
      <View style={styles.sectionContainer as any}>
        <Text style={styles.sectionTitle as any}>Available Games</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gamesScrollView as any}>
          {GAME_TYPES.map(game => {
            const isSelected = selectedGames.some(g => g.type === game.type);
            return (
              <TouchableOpacity
                key={game.type}
                style={[
                  styles.gameCard as any,
                  isSelected && styles.selectedGameCard as any,
                ]}
                onPress={() => handleGameSelect(game.type)}
              >
                <View style={styles.gameIconContainer as any}>
                  <FontAwesome5 name={game.icon} size={24} color={isSelected ? COLORS.secondary : COLORS.primary} />
                </View>
                <Text style={[
                  styles.gameTitle as any,
                  isSelected && styles.selectedGameTitle as any,
                ]}>
                  {game.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      
      {selectedGames.length > 0 && (
        <View style={styles.sectionContainer as any}>
          <Text style={styles.sectionTitle as any}>Selected Games</Text>
          {selectedGames.map(game => (
            <Card key={game.id} style={styles.selectedGameDetailCard as any}>
              <View style={styles.gameDetailHeader as any}>
                <Text style={styles.gameDetailTitle as any}>{
                  game.type === 'nassau' ? 'Nassau' :
                  game.type === 'skins' ? 'Skins' :
                  game.type === 'match-play' ? 'Match Play' :
                  game.type === 'stableford' ? 'Stableford' :
                  game.type === 'vegas' ? 'Vegas' :
                  'Wolf'
                }</Text>
                <TouchableOpacity
                  style={styles.removeButton as any}
                  onPress={() => {
                    const updatedGames = selectedGames.filter(g => g.id !== game.id);
                    dispatch(selectGame({ type: game.type, players: selectedPlayers, stake: 1 }));
                  }}
                >
                  <FontAwesome5 name="times" size={16} color={COLORS.error} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.gameSettings as any}>
                <Text style={styles.gameSettingLabel as any}>Stake:</Text>
                <TextInput
                  style={styles.gameSettingInput as any}
                  value={game.stake.toString()}
                  onChangeText={(value) => {
                    const stake = parseFloat(value) || 0;
                    dispatch(selectGame({ type: game.type, players: selectedPlayers, stake }));
                  }}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
              </View>
            </Card>
          ))}
        </View>
      )}
      
      <View style={styles.navigationButtons as any}>
        <Button
          title="Back"
          variant="outline"
          onPress={() => setStep(2)}
          style={styles.navigationButton as any}
        />
        <Button
          title="Start Round"
          onPress={handleStartRound}
          style={styles.navigationButton as any}
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container as any}>
      <View style={styles.stepIndicator as any}>
        <View
          style={[
            styles.stepDot as any,
            step >= 1 && styles.activeStepDot as any,
          ]}
        >
          <Text style={styles.stepNumber as any}>1</Text>
        </View>
        <View style={styles.stepLine as any} />
        <View
          style={[
            styles.stepDot as any,
            step >= 2 && styles.activeStepDot as any,
          ]}
        >
          <Text style={styles.stepNumber as any}>2</Text>
        </View>
        <View style={styles.stepLine as any} />
        <View
          style={[
            styles.stepDot as any,
            step >= 3 && styles.activeStepDot as any,
          ]}
        >
          <Text style={styles.stepNumber as any}>3</Text>
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
    backgroundColor: COLORS.background,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.padding * 2,
    backgroundColor: COLORS.secondary,
    ...SHADOWS.light,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeStepDot: {
    backgroundColor: COLORS.primary,
  },
  stepNumber: {
    ...createFontStyle(FONTS.body4),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: SIZES.base,
  },
  stepContainer: {
    padding: SIZES.padding,
  },
  stepTitle: {
    ...createFontStyle(FONTS.h2),
    color: COLORS.textPrimary,
    marginBottom: SIZES.padding,
  },
  sectionContainer: {
    marginBottom: SIZES.padding,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  sectionTitle: {
    ...createFontStyle(FONTS.h3),
    color: COLORS.textPrimary,
    marginBottom: SIZES.base,
  },
  courseCard: {
    marginBottom: SIZES.base,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base / 2,
  },
  courseName: {
    ...createFontStyle(FONTS.h4),
    color: COLORS.textPrimary,
  },
  courseDetails: {
    ...createFontStyle(FONTS.body4),
    color: COLORS.textSecondary,
  },
  playerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  selectedPlayerCard: {
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    ...createFontStyle(FONTS.h4),
    color: COLORS.textPrimary,
  },
  playerHandicap: {
    ...createFontStyle(FONTS.body4),
    color: COLORS.textSecondary,
  },
  selectedDetailCard: {
    marginBottom: SIZES.base,
  },
  teeSelection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.base,
  },
  teeLabel: {
    ...createFontStyle(FONTS.body4),
    color: COLORS.textPrimary,
    marginRight: SIZES.base,
  },
  teeOption: {
    paddingHorizontal: SIZES.base,
    paddingVertical: SIZES.base / 2,
    borderRadius: SIZES.radius / 2,
    marginRight: SIZES.base,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedTeeOption: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  teeName: {
    ...createFontStyle(FONTS.body5),
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.padding,
  },
  navigationButton: {
    flex: 1,
    marginHorizontal: SIZES.base,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionCard: {
    width: '48%',
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.base * 2,
    ...SHADOWS.light,
  },
  selectedOptionCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  optionTitle: {
    ...createFontStyle(FONTS.h4),
    color: COLORS.textPrimary,
    marginBottom: SIZES.base / 2,
  },
  optionDescription: {
    ...createFontStyle(FONTS.body5),
    color: COLORS.textSecondary,
  },
  customHoleContainer: {
    marginTop: SIZES.base,
  },
  customHoleLabel: {
    ...createFontStyle(FONTS.body4),
    color: COLORS.textPrimary,
    marginBottom: SIZES.base,
  },
  customHoleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  customHoleOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    margin: SIZES.base / 2,
    ...SHADOWS.light,
  },
  selectedCustomHoleOption: {
    backgroundColor: COLORS.primary,
  },
  customHoleText: {
    ...createFontStyle(FONTS.body4),
    color: COLORS.textPrimary,
  },
  selectedCustomHoleText: {
    color: COLORS.secondary,
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gameCard: {
    width: '48%',
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.base * 2,
    ...SHADOWS.light,
    position: 'relative',
  },
  selectedGameCard: {
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  gameTitle: {
    ...createFontStyle(FONTS.h4),
    color: COLORS.textPrimary,
    marginBottom: SIZES.base / 2,
  },
  gameDescription: {
    ...createFontStyle(FONTS.body5),
    color: COLORS.textSecondary,
  },
  selectedGameIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  selectedGameTitle: {
    color: COLORS.secondary,
  },
  selectedGameDetailCard: {
    marginBottom: SIZES.base,
  },
  gameDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  gameDetailTitle: {
    ...createFontStyle(FONTS.h4),
    color: COLORS.textPrimary,
  },
  removeButton: {
    padding: SIZES.base,
  },
  gameSettings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.base,
  },
  gameSettingLabel: {
    ...createFontStyle(FONTS.body4),
    color: COLORS.textPrimary,
  },
  gameSettingInput: {
    width: 80,
    padding: SIZES.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
  },
  gamesScrollView: {
    marginBottom: SIZES.padding,
  },
}) as Record<string, StyleProp<ViewStyle> | StyleProp<TextStyle> | StyleProp<ImageStyle>>; 