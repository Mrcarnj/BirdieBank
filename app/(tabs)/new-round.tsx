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
import { fetchCourses, fetchNearbyCourses, selectCourse } from '../../store/slices/courseSlice';
import { fetchPlayers, selectPlayer, addGuestPlayer } from '../../store/slices/playerSlice';
import { startNewRound } from '../../store/slices/roundSlice';
import { selectGame } from '../../store/slices/gameSlice';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';

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

  const handleCourseSelect = (course) => {
    dispatch(selectCourse(course));
    setStep(2);
  };

  const handlePlayerSelect = (player, tee) => {
    dispatch(selectPlayer({ player, tee }));
  };

  const handleAddGuestPlayer = () => {
    // Simple implementation - in a real app, you'd have a modal for name input
    const guestName = `Guest ${players.filter(p => p.isGuest).length + 1}`;
    dispatch(addGuestPlayer({ name: guestName }));
  };

  const handleGameSelect = (gameType) => {
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

    router.replace('/(tabs)/round');
  };

  const renderCourseSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select a Course</Text>
      
      {locationPermission && nearbyCourses.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Nearby Courses</Text>
          {nearbyCourses.map(course => (
            <Card
              key={course.id}
              onPress={() => handleCourseSelect(course)}
              style={styles.courseCard}
            >
              <View style={styles.courseHeader}>
                <Text style={styles.courseName}>{course.name}</Text>
                <FontAwesome5 name="map-marker-alt" size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.courseDetails}>
                {course.holes.length} holes • {course.tees.length} tee options
              </Text>
            </Card>
          ))}
        </View>
      )}
      
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>All Courses</Text>
        {courses.map(course => (
          <Card
            key={course.id}
            onPress={() => handleCourseSelect(course)}
            style={styles.courseCard}
          >
            <View style={styles.courseHeader}>
              <Text style={styles.courseName}>{course.name}</Text>
            </View>
            <Text style={styles.courseDetails}>
              {course.holes.length} holes • {course.tees.length} tee options
            </Text>
          </Card>
        ))}
      </View>
    </View>
  );

  const renderPlayerSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Players</Text>
      
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Players</Text>
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
                styles.playerCard,
                isSelected && styles.selectedPlayerCard,
              ]}
              onPress={() => handlePlayerSelect(player, null)}
            >
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.name}</Text>
                {player.handicapIndex !== undefined && (
                  <Text style={styles.playerHandicap}>
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
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Selected Players</Text>
          {selectedPlayers.map(player => (
            <Card key={player.id} style={styles.selectedDetailCard}>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.name}</Text>
              </View>
              <View style={styles.teeSelection}>
                <Text style={styles.teeLabel}>Tee:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {selectedCourse?.tees.map(tee => (
                    <TouchableOpacity
                      key={tee.id}
                      style={[
                        styles.teeOption,
                        player.selectedTee?.id === tee.id && styles.selectedTeeOption,
                        { backgroundColor: tee.color },
                      ]}
                      onPress={() => handlePlayerSelect(player, tee)}
                    >
                      <Text style={styles.teeName}>{tee.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </Card>
          ))}
        </View>
      )}
      
      <View style={styles.navigationButtons}>
        <Button
          title="Back"
          variant="outline"
          onPress={() => setStep(1)}
          style={styles.navigationButton}
        />
        <Button
          title="Next"
          onPress={() => setStep(3)}
          style={styles.navigationButton}
          disabled={selectedPlayers.length === 0}
        />
      </View>
    </View>
  );

  const renderGameSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Round Settings</Text>
      
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Hole Selection</Text>
        <View style={styles.optionsGrid}>
          <TouchableOpacity
            style={[
              styles.optionCard,
              holeSelection === 'front9' && styles.selectedOptionCard,
            ]}
            onPress={() => setHoleSelection('front9')}
          >
            <Text style={styles.optionTitle}>Front 9</Text>
            <Text style={styles.optionDescription}>Holes 1-9</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.optionCard,
              holeSelection === 'back9' && styles.selectedOptionCard,
            ]}
            onPress={() => setHoleSelection('back9')}
          >
            <Text style={styles.optionTitle}>Back 9</Text>
            <Text style={styles.optionDescription}>Holes 10-18</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.optionCard,
              holeSelection === 'full18' && styles.selectedOptionCard,
            ]}
            onPress={() => setHoleSelection('full18')}
          >
            <Text style={styles.optionTitle}>Full 18</Text>
            <Text style={styles.optionDescription}>All holes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.optionCard,
              holeSelection === 'custom' && styles.selectedOptionCard,
            ]}
            onPress={() => setHoleSelection('custom')}
          >
            <Text style={styles.optionTitle}>Custom</Text>
            <Text style={styles.optionDescription}>Select start hole</Text>
          </TouchableOpacity>
        </View>
        
        {holeSelection === 'custom' && (
          <View style={styles.customHoleContainer}>
            <Text style={styles.customHoleLabel}>Starting Hole:</Text>
            <View style={styles.customHoleOptions}>
              {Array.from({ length: 18 }, (_, i) => i + 1).map(hole => (
                <TouchableOpacity
                  key={hole}
                  style={[
                    styles.customHoleOption,
                    customStartHole === hole && styles.selectedCustomHoleOption,
                  ]}
                  onPress={() => setCustomStartHole(hole)}
                >
                  <Text
                    style={[
                      styles.customHoleText,
                      customStartHole === hole && styles.selectedCustomHoleText,
                    ]}
                  >
                    {hole}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
      
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Game Types (Optional)</Text>
        <View style={styles.gamesGrid}>
          {availableGames.map(game => {
            const isSelected = selectedGames.some(g => g.type === game.type);
            return (
              <TouchableOpacity
                key={game.type}
                style={[
                  styles.gameCard,
                  isSelected && styles.selectedGameCard,
                ]}
                onPress={() => handleGameSelect(game.type)}
              >
                <Text style={styles.gameTitle}>{game.name}</Text>
                <Text style={styles.gameDescription}>{game.description}</Text>
                {isSelected && (
                  <View style={styles.selectedGameIndicator}>
                    <FontAwesome5 name="check" size={12} color={COLORS.secondary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      
      <View style={styles.navigationButtons}>
        <Button
          title="Back"
          variant="outline"
          onPress={() => setStep(2)}
          style={styles.navigationButton}
        />
        <Button
          title="Start Round"
          onPress={handleStartRound}
          style={styles.navigationButton}
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.stepIndicator}>
        <View
          style={[
            styles.stepDot,
            step >= 1 && styles.activeStepDot,
          ]}
        >
          <Text style={styles.stepNumber}>1</Text>
        </View>
        <View style={styles.stepLine} />
        <View
          style={[
            styles.stepDot,
            step >= 2 && styles.activeStepDot,
          ]}
        >
          <Text style={styles.stepNumber}>2</Text>
        </View>
        <View style={styles.stepLine} />
        <View
          style={[
            styles.stepDot,
            step >= 3 && styles.activeStepDot,
          ]}
        >
          <Text style={styles.stepNumber}>3</Text>
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
    ...FONTS.body4,
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
    ...FONTS.h2,
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
    ...FONTS.h3,
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
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  courseDetails: {
    ...FONTS.body4,
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
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  playerHandicap: {
    ...FONTS.body4,
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
    ...FONTS.body4,
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
    ...FONTS.body5,
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
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: SIZES.base / 2,
  },
  optionDescription: {
    ...FONTS.body5,
    color: COLORS.textSecondary,
  },
  customHoleContainer: {
    marginTop: SIZES.base,
  },
  customHoleLabel: {
    ...FONTS.body4,
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
    ...FONTS.body4,
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
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: SIZES.base / 2,
  },
  gameDescription: {
    ...FONTS.body5,
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
}); 