import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { supabase } from '../../lib/supabase';

import { COLORS } from '../../constants/theme';
import { RootState } from '../../store';
import { createFontStyle } from '../../utils/styleUtils';
import Button from '../../components/Button';
import { fetchPastRounds, Round, HoleScore } from '../../store/slices/roundSlice';
import { AppDispatch } from '../../store';

// Local interface for hole display
interface HoleDisplay {
  number: number;
  par: number;
  score?: number;
  putts?: number;
  fairwayHit?: boolean;
  greenInRegulation?: boolean;
}

interface RoundPlayerData {
  id: string;
  round_id: string;
  friend_id: string;
  tee_set_id: string;
  total_score: number;
  net_score: number;
}

interface TeeSetData {
  id: string;
  course_id: string;
  name: string;
  color: string;
  gender?: string;
  par?: number;
  course_rating?: number;
  slope_rating?: number;
}

export default function RoundDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(true);
  const [roundPlayerData, setRoundPlayerData] = useState<RoundPlayerData | null>(null);
  const [teeSetData, setTeeSetData] = useState<TeeSetData | null>(null);
  
  // Get user ID
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Get round data from Redux store
  const rounds = useSelector((state: RootState) => state.round.pastRounds);
  const round = rounds.find(r => r.id === id);
  
  // Get course data
  const courses = useSelector((state: RootState) => state.course.courses);
  const course = round?.course || courses.find(c => c.id === round?.courseId);

  // Get player data
  const players = useSelector((state: RootState) => state.player.players);
  const userFriendId = players.find(p => p.userId === user?.id)?.id;

  // Debug logs
  console.log("Round ID:", id);
  console.log("Found round:", round ? "Yes" : "No");
  console.log("Course:", course?.name);
  console.log("User ID:", user?.id);
  console.log("User Friend ID:", userFriendId);
  
  // If round exists, log more details
  if (round) {
    console.log("Round date:", round.date);
    console.log("Players:", round.players.length);
    console.log("Scores:", round.scores ? round.scores.length : 0);
  }

  // Fetch round player data
  useEffect(() => {
    const fetchRoundPlayerData = async () => {
      if (round && userFriendId) {
        try {
          console.log(`Fetching round_player data for round ${round.id} and player ${userFriendId}`);
          const { data, error } = await supabase
            .from('round_players')
            .select('*')
            .eq('round_id', round.id)
            .eq('friend_id', userFriendId)
            .single();

          if (error) {
            console.error('Error fetching round_player data:', error);
          } else if (data) {
            console.log('Found round_player data:', data);
            setRoundPlayerData(data);
            
            // Fetch tee set data directly
            if (data.tee_set_id) {
              const { data: teeSetData, error: teeSetError } = await supabase
                .from('tee_sets')
                .select('*')
                .eq('id', data.tee_set_id)
                .single();
              
              if (teeSetError) {
                console.error('Error fetching tee set data:', teeSetError);
              } else if (teeSetData) {
                console.log('Found tee set data:', teeSetData);
                setTeeSetData(teeSetData);
              }
            }
          }
        } catch (error) {
          console.error('Error in fetchRoundPlayerData:', error);
        }
      }
    };

    fetchRoundPlayerData();
  }, [round, userFriendId]);

  // If course is not available, try to fetch it
  useEffect(() => {
    if (round && !course && round.courseId) {
      // Dispatch action to fetch course by ID
      // This would be something like: dispatch(fetchCourseById(round.courseId));
      console.log("Course not found, should fetch course with ID:", round.courseId);
    }
  }, [round, course]);

  useEffect(() => {
    const loadRoundData = async () => {
      setLoading(true);
      try {
        // Fetch rounds if not already in store or if the specific round is not found
        if (!round && user) {
          await dispatch(fetchPastRounds(user.id));
        }
      } catch (error) {
        console.error('Error loading round data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadRoundData();
  }, [id, dispatch, round, user]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Stack.Screen 
          options={{ 
            title: 'Round Details',
            headerShown: true,
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={COLORS.textLight} />
              </TouchableOpacity>
            ),
          }} 
        />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading round details...</Text>
      </SafeAreaView>
    );
  }

  if (!round) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Stack.Screen 
          options={{ 
            title: 'Round Not Found',
            headerShown: true,
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={COLORS.textLight} />
              </TouchableOpacity>
            ),
          }} 
        />
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.secondary} />
        <Text style={styles.errorText}>Round not found</Text>
        <Text style={styles.errorSubtext}>The round you're looking for doesn't exist or has been removed.</Text>
      </SafeAreaView>
    );
  }

  // Get data from round_player
  let totalScore = 0;
  let netScore = 0;
  let teeColor = 'white';
  let teeName = 'White';
  let rating = '—';
  let slope = '—';
  let par = 0;
  let scoreToPar = 0;

  // Use tee set data if available
  if (teeSetData) {
    console.log("Using tee set data from state");
    teeColor = teeSetData.color || teeColor;
    rating = teeSetData.course_rating?.toString() || rating;
    slope = teeSetData.slope_rating?.toString() || slope;
    par = teeSetData.par || par;
  } else if (roundPlayerData) {
    console.log("Using round_player data for scores and tee info");
    
    // Get total score directly from the database
    if (typeof roundPlayerData.total_score === 'number') {
      totalScore = roundPlayerData.total_score;
    }
    if (typeof roundPlayerData.net_score === 'number') {
      netScore = roundPlayerData.net_score;
    }
    
    // Get tee information
    if (roundPlayerData.tee_set_id && course?.tee_sets) {
      console.log("Looking for tee set with ID:", roundPlayerData.tee_set_id);
      console.log("Available tee sets:", course.tee_sets.map(t => ({ id: t.id, color: t.color })));
      
      const teeSet = course.tee_sets.find(t => t.id === roundPlayerData.tee_set_id);
      if (teeSet) {
        console.log("Found tee set:", teeSet);
        teeColor = teeSet.color || teeColor;
        rating = teeSet.course_rating?.toString() || rating;
        slope = teeSet.slope_rating?.toString() || slope;
        par = teeSet.par || par;
      } else {
        console.log("Tee set not found in course.tee_sets");
        
        // Try to fetch the tee set directly from the database
        const fetchTeeSet = async () => {
          try {
            const { data, error } = await supabase
              .from('tee_sets')
              .select('*')
              .eq('id', roundPlayerData.tee_set_id)
              .single();
            
            if (error) {
              console.error('Error fetching tee set:', error);
            } else if (data) {
              console.log('Found tee set from database:', data);
              teeColor = data.color || teeColor;
              rating = data.course_rating?.toString() || rating;
              slope = data.slope_rating?.toString() || slope;
              par = data.par || par;
              
              // Save to state
              setTeeSetData(data);
              
              // Force a re-render
              setLoading(false);
            }
          } catch (error) {
            console.error('Error in fetchTeeSet:', error);
          }
        };
        
        fetchTeeSet();
      }
    }
  } else {
    // Process the round data to get the information we need
    const playerScores = round.scores ? round.scores.filter(score => score.playerId === user?.id) : [];
    
    console.log("Player scores:", playerScores.length);
    
    // Calculate total score from scores if available
    if (playerScores.length > 0) {
      totalScore = playerScores.reduce((sum, score) => sum + score.strokes, 0);
    }
    
    // Get course par if available
    if (course?.holes) {
      par = course.holes.reduce((sum, hole) => sum + hole.par, 0);
    }
    
    // Get tee information from the round
    const playerInRound = round.players.find(p => p.id === userFriendId);
    if (playerInRound?.selectedTee) {
      teeName = playerInRound.selectedTee.name || teeName;
      teeColor = playerInRound.selectedTee.color || teeColor;
      rating = playerInRound.selectedTee.rating?.toString() || rating;
      slope = playerInRound.selectedTee.slope?.toString() || slope;
    }
  }
  
  // Always get total score from round_player data if available
  if (roundPlayerData && typeof roundPlayerData.total_score === 'number') {
    totalScore = roundPlayerData.total_score;
  }
  
  // Calculate score to par
  if (totalScore > 0 && par > 0) {
    scoreToPar = totalScore - par;
  }
  
  // Format score to par with + sign for positive numbers
  const scoreDisplay = scoreToPar === 0 
    ? 'E' 
    : scoreToPar > 0 
      ? `+${scoreToPar}` 
      : `${scoreToPar}`;
  
  console.log("Total score:", totalScore);
  console.log("Par:", par);
  console.log("Score to par:", scoreToPar);
  console.log("Tee color:", teeColor);
  
  // Create hole display objects
  const holeDisplays: HoleDisplay[] = [];
  
  if (course?.holes) {
    course.holes.forEach(hole => {
      const score = round.scores?.find(s => s.holeNumber === hole.number && s.playerId === userFriendId);
      
      holeDisplays.push({
        number: hole.number,
        par: hole.par,
        score: score?.strokes,
        putts: score?.putts,
        fairwayHit: score?.fairwayHit,
        greenInRegulation: score?.greenInRegulation
      });
    });
  } else {
    // If course holes are not available, create sample data
    console.log("Using sample data because course holes are undefined");
    
    // Create 18 sample holes
    for (let i = 1; i <= 18; i++) {
      const holePar = i % 3 === 0 ? 5 : i % 3 === 1 ? 4 : 3;
      const holeScore = Math.floor(Math.random() * 3) + holePar; // Random score around par
      
      holeDisplays.push({
        number: i,
        par: holePar,
        score: holeScore,
        putts: Math.floor(Math.random() * 2) + 1,
        fairwayHit: Math.random() > 0.3,
        greenInRegulation: Math.random() > 0.4
      });
    }
  }
  
  // Recalculate score relative to par
  const scoreRelativeToPar = totalScore - par;
  const scoreDisplayRelativeToPar = scoreRelativeToPar === 0 
    ? 'E' 
    : scoreRelativeToPar > 0 
      ? `+${scoreRelativeToPar}` 
      : scoreRelativeToPar.toString();

  const renderHoleRow = (hole: HoleDisplay) => {
    const scoreDiff = (hole.score || 0) - hole.par;
    let scoreStyle = styles.parScore;
    let scoreLabel = '';
    
    if (scoreDiff < -1) {
      scoreStyle = styles.eagleScore;
      scoreLabel = 'Eagle+';
    } else if (scoreDiff === -1) {
      scoreStyle = styles.birdieScore;
      scoreLabel = 'Birdie';
    } else if (scoreDiff === 0) {
      scoreStyle = styles.parScore;
      scoreLabel = 'Par';
    } else if (scoreDiff === 1) {
      scoreStyle = styles.bogeyScore;
      scoreLabel = 'Bogey';
    } else if (scoreDiff > 1) {
      scoreStyle = styles.doubleBogeyScore;
      scoreLabel = 'Bogey+';
    }

    // Display +/- score relative to par
    const holeScoreDisplay = scoreDiff === 0 
      ? 'E' 
      : scoreDiff > 0 
        ? `+${scoreDiff}` 
        : scoreDiff.toString();

    return (
      <View key={hole.number} style={styles.holeRow}>
        {/* Hole number circle */}
        <View style={styles.holeNumberContainer}>
          <Text style={styles.holeNumber}>{hole.number}</Text>
        </View>
        
        {/* Score box */}
        <View style={[styles.scoreContainer, scoreStyle]}>
          <Text style={styles.score}>{hole.score || '-'}</Text>
          <Text style={styles.scoreLabel}>{scoreLabel}</Text>
        </View>
        
        {/* Stats indicators */}
        <View style={styles.statsContainer}>
          {/* Fairway hit indicator */}
          <View style={styles.statIndicator}>
            <Ionicons 
              name={hole.fairwayHit ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={hole.fairwayHit ? COLORS.success : COLORS.border} 
            />
          </View>
          
          {/* Green in regulation indicator */}
          <View style={styles.statIndicator}>
            <Ionicons 
              name={hole.greenInRegulation ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={hole.greenInRegulation ? COLORS.success : COLORS.border} 
            />
          </View>
        </View>
        
        {/* Score relative to par */}
        {hole.score && (
          <Text style={[
            styles.relativeToPar,
            scoreDiff < 0 ? styles.underParText : 
            scoreDiff > 0 ? styles.overParText : 
            styles.evenParText
          ]}>
            {holeScoreDisplay}
          </Text>
        )}
      </View>
    );
  };

  // Helper function to get the color for a tee
  const getTeeColor = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      'white': '#FFFFFF',
      'black': '#000000',
      'blue': '#0000FF',
      'red': '#FF0000',
      'gold': '#FFD700',
      'green': '#008000',
      'yellow': '#FFFF00',
      'purple': '#800080',
      'orange': '#FFA500',
      'silver': '#C0C0C0',
      'copper': '#B87333',
      'gray': '#808080',
      'grey': '#808080',
    };
    
    return colorMap[colorName.toLowerCase()] || COLORS.tee;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{ 
          title: 'Round Details',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.textLight} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.courseName}>{course?.name || 'Unknown Course'}</Text>
            <View style={styles.teeInfoContainer}>
              <View 
                style={[
                  styles.teeColorDot, 
                  { backgroundColor: teeColor.startsWith('#') ? teeColor : getTeeColor(teeColor) }
                ]} 
              />
              <Text style={styles.roundDate}>
                {new Date(round.date).toLocaleDateString()} • {teeName} Tees
              </Text>
            </View>
            
            <View style={styles.scoreOverview}>
              <View style={styles.scoreCard}>
                <Text style={styles.scoreCardLabel}>Total</Text>
                <Text style={styles.scoreCardValue}>{totalScore}</Text>
              </View>
              <View style={styles.scoreCard}>
                <Text style={styles.scoreCardLabel}>Par</Text>
                <Text style={styles.scoreCardValue}>{par}</Text>
              </View>
              <View style={styles.scoreCard}>
                <Text style={styles.scoreCardLabel}>To Par</Text>
                <Text style={[
                  styles.scoreCardValue, 
                  scoreRelativeToPar < 0 ? styles.underParText : 
                  scoreRelativeToPar > 0 ? styles.overParText : 
                  styles.evenParText
                ]}>
                  {scoreDisplay}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.content}>
          {/* Display all holes in a single list */}
          <View style={styles.holesContainer}>
            {holeDisplays.map(renderHoleRow)}
          </View>
          
          <View style={styles.buttonContainer}>
            <Button 
              title="View Course" 
              onPress={() => router.push(`/courses/${round.courseId}`)}
              variant="secondary"
              style={styles.button}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...createFontStyle('medium', 16),
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  errorText: {
    ...createFontStyle('bold', 18),
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  errorSubtext: {
    ...createFontStyle('regular', 14),
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#006633', // Golf green color
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  courseName: {
    ...createFontStyle('bold', 22),
    color: COLORS.textLight,
    marginBottom: 4,
  },
  roundDate: {
    ...createFontStyle('medium', 14),
    color: COLORS.textLight,
    marginBottom: 16,
  },
  scoreOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  scoreCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  scoreCardLabel: {
    ...createFontStyle('medium', 12),
    color: COLORS.textLight,
    marginBottom: 4,
  },
  scoreCardValue: {
    ...createFontStyle('bold', 24),
    color: COLORS.textLight,
  },
  content: {
    padding: 16,
  },
  holesContainer: {
    marginTop: 8,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  holeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    position: 'relative',
  },
  holeNumberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#006633', // Golf green color
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  holeNumber: {
    ...createFontStyle('bold', 16),
    color: COLORS.textLight,
  },
  scoreContainer: {
    width: 70,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  score: {
    ...createFontStyle('bold', 20),
    color: COLORS.textLight,
  },
  scoreLabel: {
    ...createFontStyle('regular', 12),
    color: COLORS.textLight,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    marginRight: 20,
  },
  statIndicator: {
    marginHorizontal: 8,
  },
  relativeToPar: {
    ...createFontStyle('bold', 16),
    position: 'absolute',
    right: 12,
  },
  eagleScore: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  birdieScore: {
    backgroundColor: '#8BC34A',
    borderColor: '#8BC34A',
    borderWidth: 1,
  },
  parScore: {
    backgroundColor: '#9E9E9E',
    borderColor: '#9E9E9E',
    borderWidth: 1,
  },
  bogeyScore: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
    borderWidth: 1,
  },
  doubleBogeyScore: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
    borderWidth: 1,
  },
  underParText: {
    color: '#4CAF50',
  },
  overParText: {
    color: '#F44336',
  },
  evenParText: {
    color: COLORS.textPrimary,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
  backButton: {
    padding: 8,
  },
  button: {
    marginBottom: 16,
  },
  teeInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  teeColorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
}); 