import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { FONTS, SIZES } from '../../constants/theme';
import { RootState, AppDispatch, store } from '../../store';
import { Course, fetchCourses, fetchNearbyCourses, selectCourse, Tee, fetchCourseById } from '../../store/slices/courseSlice';
import { fetchPlayers, selectPlayer, Player as BasePlayer, PlayerWithTee, createFriend, ensureUserInFriendsTable } from '../../store/slices/playerSlice';
import { startNewRound } from '../../store/slices/roundSlice';
import { selectGame, removeGame } from '../../store/slices/gameSlice';
import { createFontStyle } from '../../utils/styleUtils';
import { useTheme } from '../../components/ThemeProvider';
import { GAME_TYPES } from '../../utils/games';

// Import new components
import CourseSelection from '../../components/new-round/CourseSelection';
import PlayerSelection from '../../components/new-round/PlayerSelection';
import GameSelection from '../../components/new-round/GameSelection';
import GameConfigModal, { GameConfig } from '../../components/new-round/GameConfigModal';
import TeeSelectionModal from '../../components/new-round/TeeSelectionModal';
import AddPlayerModal from '../../components/new-round/AddPlayerModal';

// Helper function to determine if a color is white or very light
const isLightColor = (color: string) => {
  // Check if color is white or very close to white
  return color === '#FFFFFF' || color === '#FFF' || color === 'white' || color.toLowerCase() === '#ffffff';
};

// Helper function to format course handicap with proper golf notation
const formatCourseHandicap = (handicap: number): string => {
  if (handicap < 0) {
    return `+${Math.abs(handicap)}`;
  }
  return handicap.toString();
};

// Extend the Player interface to include email
interface Player extends BasePlayer {
  email?: string;
}

export default function NewRoundScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const { courses, nearbyCourses, selectedCourse } = useSelector((state: RootState) => state.course);
  const { players, selectedPlayers } = useSelector((state: RootState) => state.player);
  const { selectedGames } = useSelector((state: RootState) => state.game);
  const { colors, shadows } = useTheme();
  
  // Add ScrollView reference
  const scrollViewRef = useRef<ScrollView>(null);
  
  // State variables
  const [step, setStep] = useState(1);
  const [holeSelection, setHoleSelection] = useState<'front9' | 'back9' | 'full18' | 'custom'>('full18');
  const [startingHole, setStartingHole] = useState(1);
  const [locationPermission, setLocationPermission] = useState(false);
  const [showTeeModal, setShowTeeModal] = useState(false);
  const [selectedPlayerForTee, setSelectedPlayerForTee] = useState<Player | null>(null);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [newPlayerFirstName, setNewPlayerFirstName] = useState('');
  const [newPlayerLastName, setNewPlayerLastName] = useState('');
  const [newPlayerHandicap, setNewPlayerHandicap] = useState('');
  const [newPlayerEmail, setNewPlayerEmail] = useState('');
  const [isPlusHandicap, setIsPlusHandicap] = useState(false);
  const [addPlayerTab, setAddPlayerTab] = useState<'friends' | 'new'>('friends');

  // Game configuration state
  const [showGameConfigModal, setShowGameConfigModal] = useState(false);
  const [gameToConfig, setGameToConfig] = useState<{
    type: string;
    name: string;
    description: string;
    icon: string;
  } | null>(null);

  // Load initial data
  useEffect(() => {
    dispatch(fetchCourses());
    if (user) {
      dispatch(fetchPlayers(user.id));
      
      // Ensure the current user exists in the friends table
      dispatch(ensureUserInFriendsTable(user.id))
        .unwrap()
        .then(friendId => {
          console.log('User ensured in friends table with ID:', friendId);
        })
        .catch(error => {
          console.error('Failed to ensure user in friends table:', error);
        });
    }
    checkLocationPermission();
  }, [dispatch, user]);

  // Check location permission for nearby courses
  const checkLocationPermission = async () => {
    try {
      // Location permission logic would go here
      // For now, just set to true
      setLocationPermission(true);
      dispatch(fetchNearbyCourses());
    } catch (error) {
      console.log('Location permission denied');
    }
  };

  // Handle course selection
  const handleCourseSelect = (course: Course) => {
    const safeHoles = course.holes || [];
    const safeCourse = {
      ...course,
      holes: safeHoles
    };
    
    dispatch(selectCourse(safeCourse));
    
    setTimeout(() => {
      const courseState = store.getState().course;
      if (courseState.needsHoleData && courseState.selectedCourse) {
        console.log('Fetching detailed course data...');
        dispatch(fetchCourseById(courseState.selectedCourse.id))
          .unwrap()
          .then(() => {
            console.log('Course details fetched successfully');
          })
          .catch(error => {
            console.error('Failed to fetch course details:', error);
            Alert.alert('Error', 'Failed to load course details. Please try selecting a different course.');
          });
      }
    }, 100);
    
    // Move to player selection step and scroll to top
    setStep(2);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Handle player selection
  const handlePlayerSelect = (player: Player, tee: Tee | null) => {
    dispatch(selectPlayer({ player, tee }));
  };

  // Handle adding a player
  const handleAddPlayer = () => {
    // Reset the form fields
    setNewPlayerFirstName('');
    setNewPlayerLastName('');
    setNewPlayerHandicap('');
    setNewPlayerEmail('');
    setIsPlusHandicap(false);
    
    // Always default to friends tab
    setAddPlayerTab('friends');
    
    // Show the modal
    setShowAddPlayerModal(true);
  };

  // Handle game selection
  const handleGameSelect = (gameType: string) => {
    if (selectedPlayers.length < 2) {
      Alert.alert('Not Enough Players', 'You need at least 2 players to set up a game.');
      return;
    }
    
    const game = GAME_TYPES.find(g => g.type === gameType);
    if (game) {
      // Check if game is already selected
      const isAlreadySelected = selectedGames.some(g => g.type === gameType);
      
      if (isAlreadySelected) {
        // If already selected, remove it
        dispatch(removeGame(selectedGames.find(g => g.type === gameType)?.id || ''));
    } else {
        // Open game configuration modal
        setGameToConfig(game);
        setShowGameConfigModal(true);
      }
    }
  };

  // Handle saving game configuration
  const handleSaveGameConfig = (config: GameConfig) => {
    // Add the game to the selected games
      dispatch(selectGame({
      type: config.type as any,
        players: selectedPlayers,
      stake: config.stake,
      settings: config.settings
      }));
    
    // Close the modal
    setShowGameConfigModal(false);
    setGameToConfig(null);
  };

  // Handle starting the round
  const handleStartRound = () => {
    if (!selectedCourse) {
      Alert.alert('Error', 'Please select a course');
      return;
    }

    if (!selectedPlayers || selectedPlayers.length === 0) {
      Alert.alert('Error', 'Please select at least one player');
      return;
    }
    
    const safeSelectedCourse = {
      ...selectedCourse,
      holes: selectedCourse.holes || []
    };
    
    if (!safeSelectedCourse.holes || safeSelectedCourse.holes.length === 0) {
      Alert.alert('Error', 'The selected course has no hole data. Please select a different course or contact support.');
      return;
    }

    dispatch(startNewRound({
      course: safeSelectedCourse,
      players: selectedPlayers,
      holeSelection,
      customStartHole: startingHole,
      userId: user?.id || '',
    }));
    
    setTimeout(() => {
      const roundState = store.getState().round;
      if (roundState.error) {
        Alert.alert('Error', roundState.error);
        return;
      }
      
      if (!roundState.currentRound) {
        Alert.alert('Error', 'Failed to create round. Please try again.');
        return;
      }
      
      router.replace('/rounds/currentRound');
    }, 100);
  };

  // Handle tee selection
  const handleTeeSelect = (player: Player, tee: Tee) => {
    dispatch(selectPlayer({ player, tee }));
    setShowTeeModal(false);
    setSelectedPlayerForTee(null);
  };

  // Open tee selection modal
  const openTeeSelection = (player: Player) => {
    setSelectedPlayerForTee(player);
    setShowTeeModal(true);
  };

  // Handle hole selection change
  const handleHoleSelectionChange = (selection: 'front9' | 'back9' | 'full18' | 'custom') => {
    setHoleSelection(selection);
    
    // Set default starting hole based on selection
    if (selection === 'front9') {
      setStartingHole(1);
    } else if (selection === 'back9') {
      setStartingHole(10);
    } else if (selection === 'full18') {
      setStartingHole(1);
    }
  };

  // Handle starting hole change
  const handleStartingHoleChange = (hole: number) => {
    setStartingHole(hole);
  };

  // Modify the step navigation functions to scroll to top
  const goToStep = (newStep: number) => {
    setStep(newStep);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={[styles.contentContainer]}
        showsVerticalScrollIndicator={true}
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

        {/* Step 1: Course Selection */}
        {step === 1 && (
          <CourseSelection onCourseSelect={handleCourseSelect} />
        )}

        {/* Step 2: Player Selection */}
        {step === 2 && (
          <PlayerSelection
            selectedCourse={selectedCourse}
            selectedPlayers={selectedPlayers}
            holeSelection={holeSelection}
            startingHole={startingHole}
            onBack={() => goToStep(1)}
            onNext={() => goToStep(3)}
            onAddPlayer={handleAddPlayer}
            onOpenTeeSelection={openTeeSelection}
          />
        )}

        {/* Step 3: Game Selection */}
        {step === 3 && (
          <GameSelection
            selectedCourse={selectedCourse}
            selectedPlayers={selectedPlayers}
            holeSelection={holeSelection}
            startingHole={startingHole}
            onBack={() => goToStep(2)}
            onStartRound={handleStartRound}
            onGameSelect={handleGameSelect}
          />
        )}

        {/* Game Configuration Modal */}
        <GameConfigModal
          visible={showGameConfigModal}
          onClose={() => setShowGameConfigModal(false)}
          onSave={handleSaveGameConfig}
          gameToConfig={gameToConfig}
          players={selectedPlayers}
        />

        {/* Tee Selection Modal */}
        {selectedCourse && selectedPlayerForTee && (
          <TeeSelectionModal
            visible={showTeeModal}
            onClose={() => {
              setShowTeeModal(false);
              setSelectedPlayerForTee(null);
            }}
            player={selectedPlayerForTee}
            course={selectedCourse}
            onSelectTee={handleTeeSelect}
          />
        )}
        
        {/* Add Player Modal */}
        <AddPlayerModal
          visible={showAddPlayerModal}
          onClose={() => setShowAddPlayerModal(false)}
          activeTab={addPlayerTab}
          onTabChange={setAddPlayerTab}
          onSelectFriend={(player) => {
            setShowAddPlayerModal(false);
            setTimeout(() => openTeeSelection(player), 100);
          }}
          onCreatePlayer={(player) => {
            setShowAddPlayerModal(false);
            setTimeout(() => openTeeSelection(player), 100);
          }}
          firstName={newPlayerFirstName}
          lastName={newPlayerLastName}
          handicap={newPlayerHandicap}
          email={newPlayerEmail}
          isPlusHandicap={isPlusHandicap}
          setFirstName={setNewPlayerFirstName}
          setLastName={setNewPlayerLastName}
          setHandicap={setNewPlayerHandicap}
          setEmail={setNewPlayerEmail}
          setIsPlusHandicap={setIsPlusHandicap}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.padding,
    paddingTop: SIZES.padding / 2,
    paddingBottom: SIZES.padding * 2,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    ...createFontStyle(FONTS.h2),
    marginBottom: SIZES.padding,
    marginTop: SIZES.padding,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.padding * 2,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginTop: 0,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: SIZES.base,
  },
  stepNumber: {
    ...createFontStyle(FONTS.body4),
    fontWeight: '600',
  },
}); 