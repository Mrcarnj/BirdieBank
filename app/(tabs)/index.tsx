import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  StatusBar,
  ImageBackground,
  Platform,
  FlatList,
  RefreshControl,
  Switch,
  Alert,
  ActivityIndicator,
  Linking
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { Ionicons, FontAwesome5, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { router, useRouter } from 'expo-router';
import { FONTS, SIZES } from '../../constants/theme';
import { RootState, AppDispatch } from '../../store';
import { fetchPastRounds } from '../../store/slices/roundSlice';
import { fetchCourses } from '../../store/slices/courseSlice';
import { fetchPlayers, PlayerWithTee } from '../../store/slices/playerSlice';
import { setDarkMode } from '../../store/slices/themeSlice';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { createFontStyle } from '../../utils/styleUtils';
import { useTheme } from '../../components/ThemeProvider';
import MaskedView from '@react-native-masked-view/masked-view';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;
const CARD_HEIGHT = height * 0.22;
const SPACING = 12;

// Add type definitions for weather and location
interface WeatherData {
  temperature: number | null;
  condition: string;
  windSpeed: number | null;
  icon: 'sunny' | 'cloudy' | 'rainy' | 'thunderstorm' | 'cloud-outline';
}



export default function HomeScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { pastRounds, currentRound } = useSelector((state: RootState) => state.round);
  const { courses } = useSelector((state: RootState) => state.course);
  const { players } = useSelector((state: RootState) => state.player);
  const { isDarkMode } = useSelector((state: RootState) => state.theme);
  const { colors, shadows } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [weather, setWeather] = useState<WeatherData>({
    temperature: null,
    condition: 'Loading...',
    windSpeed: null,
    icon: 'cloud-outline'
  });

  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp'
  });

  const headerScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp'
  });

  const contentPaddingTop = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [Platform.OS === 'ios' ? 130 : 110, Platform.OS === 'ios' ? 110 : 100, 90],
    extrapolate: 'clamp'
  });

  useEffect(() => {
    if (user) {
      loadData();
      getLocationAndWeather();
    }
  }, [user]);

  const getLocationAndWeather = async () => {
    try {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        console.log('Location permission denied');
        // Set default weather if permission denied
        setWeather({
          temperature: 72,
          condition: 'Sunny',
          windSpeed: 5,
          icon: 'sunny'
        });
        return;
      }

      // Get current location
      let locationData = await Location.getCurrentPositionAsync({});
      setLocation(locationData);

      // Fetch weather data based on location
      fetchWeatherData(locationData.coords.latitude, locationData.coords.longitude);
    } catch (error) {
      console.error('Error getting location or weather:', error);
      // Set default weather if there's an error
      setWeather({
        temperature: 72,
        condition: 'Sunny',
        windSpeed: 5,
        icon: 'sunny'
      });
    }
  };

  const fetchWeatherData = async (latitude: number, longitude: number) => {
    try {
      // Using OpenWeatherMap API (you would need to get your own API key)
      // For demo purposes, we'll use a mock response

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock weather data - in a real app, you would fetch from a weather API
      const mockWeatherData = {
        main: {
          temp: Math.floor(Math.random() * 30) + 60, // Random temp between 60-90°F
        },
        weather: [
          {
            main: ['Clear', 'Clouds', 'Rain', 'Thunderstorm'][Math.floor(Math.random() * 4)],
          }
        ],
        wind: {
          speed: Math.floor(Math.random() * 15) + 1, // Random wind speed 1-15 mph
        }
      };

      // Map weather condition to icon
      let weatherIcon: 'sunny' | 'cloudy' | 'rainy' | 'thunderstorm' | 'cloud-outline' = 'cloud-outline';
      switch (mockWeatherData.weather[0].main) {
        case 'Clear':
          weatherIcon = 'sunny';
          break;
        case 'Clouds':
          weatherIcon = 'cloudy';
          break;
        case 'Rain':
          weatherIcon = 'rainy';
          break;
        case 'Thunderstorm':
          weatherIcon = 'thunderstorm';
          break;
        default:
          weatherIcon = 'cloud-outline';
      }

      // Update weather state
      setWeather({
        temperature: mockWeatherData.main.temp,
        condition: mockWeatherData.weather[0].main,
        windSpeed: mockWeatherData.wind.speed,
        icon: weatherIcon
      });
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Set default weather if there's an error
      setWeather({
        temperature: 72,
        condition: 'Sunny',
        windSpeed: 5,
        icon: 'sunny'
      });
    }
  };

  const loadData = async () => {
    if (user) {
      dispatch(fetchPastRounds(user.id));
      dispatch(fetchCourses());
      dispatch(fetchPlayers(user.id));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), getLocationAndWeather()]);
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Calculate handicap trend (mock data for visual indicator)
  const handicapTrend = user?.handicap && user.handicap < 15 ? 'improving' : 'steady';

  // Format user name
  const userName = user?.first_name ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}` : 'Golfer';

  // Get nearby courses (within 50 miles)
  const nearbyCourses = courses.slice(0, 5); // Mock data - in real app would filter by distance

  // Get friends (mock data for now)
  const friends = players.slice(0, 6);

  // Get recent rounds (last 10)
  const recentRounds = pastRounds.slice(0, 10);

  // Use refs to track if we've already logged
  const hasLoggedRoundIds = useRef(false);

  // Log all round IDs of the user only once
  useEffect(() => {
    if (recentRounds.length > 0 && !hasLoggedRoundIds.current) {
      const roundIds = recentRounds.map(round => round.id);
      console.log('All user round IDs:', roundIds);
      hasLoggedRoundIds.current = true;
    }
  }, [recentRounds]);

  // State for round players data
  const [roundPlayersData, setRoundPlayersData] = useState<any[]>([]);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const hasFetchedRoundPlayers = useRef(false);

  // Fetch round_players data only once when the component mounts and data is available
  useEffect(() => {
    const fetchRoundPlayersForUI = async () => {
      // Only fetch if we haven't already fetched, we have rounds, and we have the user's friend ID
      const userFriendId = players.find(p => p.userId === user?.id)?.id;

      if (recentRounds.length > 0 && userFriendId && !hasFetchedRoundPlayers.current) {
        setIsLoadingScores(true);
        try {
          // Get all round IDs
          const roundIds = recentRounds.map(round => round.id);
          console.log('Fetching round_players once:', roundIds);

          // Fetch round_players directly from the database
          const { data, error } = await supabase
            .from('round_players')
            .select('*')
            .in('round_id', roundIds)
            .eq('friend_id', userFriendId);

          if (error) {
            console.error('Error fetching round_players:', error);
          } else if (data) {
            console.log(`Found ${data.length} round_players`);
            setRoundPlayersData(data);
          }
        } catch (error) {
          console.error('Error in fetchRoundPlayersForUI:', error);
        } finally {
          setIsLoadingScores(false);
          // Mark that we've fetched the data so we don't fetch again
          hasFetchedRoundPlayers.current = true;
        }
      }
    };

    fetchRoundPlayersForUI();
  }, [recentRounds, players, user]); // Dependencies that should trigger a re-fetch if they change

  const renderHeader = () => (
    <Animated.View
      style={[
        styles.headerContainer,
        {
          opacity: headerOpacity,
          transform: [{ scale: headerScale }],
          backgroundColor: colors.card
        },
        shadows.medium
      ]}
    >
      <View
        style={[
          styles.headerGradient,
          { backgroundColor: isDarkMode ? '#0A1F28' : '#2E7D32' }
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.userInfoContainer}>
            <View style={styles.userAvatarContainer}>
              {user?.profile_image_url ? (
                <Image
                  source={{ uri: user.profile_image_url }}
                  style={styles.userAvatar}
                />
              ) : (
                <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.userInitials}>
                    {user?.first_name?.charAt(0) || 'G'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.userTextContainer}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderHandicapCard = () => (
    <Card
      variant="elevated"
      style={styles.handicapCard}
    >
      <View
        style={[
          styles.handicapGradient,
          { backgroundColor: isDarkMode ? '#0F172A' : '#C8E6C9' }
        ]}
      >
        <View style={styles.handicapContent}>
          <View style={styles.handicapTextContainer}>
            <Text style={[styles.handicapLabel, { color: colors.textSecondary }]}>
              HANDICAP INDEX
            </Text>
            <View style={styles.handicapValueContainer}>
              <Text style={styles.handicapValue}>
                {user?.handicap?.toFixed(1) || 'N/A'}
              </Text>

              {handicapTrend && (
                <View style={[
                  styles.trendIndicator,
                  {
                    backgroundColor: handicapTrend === 'improving'
                      ? colors.success + '20'
                      : colors.warning + '20'
                  }
                ]}>
                  <Ionicons
                    name={handicapTrend === 'improving' ? 'trending-down' : 'trending-up'}
                    size={16}
                    color={handicapTrend === 'improving' ? colors.success : colors.warning}
                  />
                  <Text style={[
                    styles.trendText,
                    {
                      color: handicapTrend === 'improving'
                        ? colors.success
                        : colors.warning
                    }
                  ]}>
                    {handicapTrend === 'improving' ? 'Improving' : 'Steady'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.weatherContainer}
            onPress={getLocationAndWeather}
            activeOpacity={0.7}
          >
            <View style={styles.weatherIconContainer}>
              <Ionicons
                name={weather.icon}
                size={24}
                color={weather.icon === 'sunny' ? '#FF9800' : '#64B5F6'}
              />
            </View>
            <Text style={styles.weatherTemp}>
              {weather.temperature ? `${weather.temperature}°` : '--°'}
            </Text>
            <Text style={[styles.weatherCondition, { color: colors.textSecondary }]}>
              {weather.condition}
            </Text>
            <Text style={[styles.weatherWind, { color: colors.textSecondary }]}>
              {weather.windSpeed ? `Wind: ${weather.windSpeed} mph` : 'Loading...'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  const renderRecentRounds = () => {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Rounds</Text>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => router.push('/history')}
          >
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {recentRounds.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentRoundsContainer}
          >
            {recentRounds.map((round, index) => {
              // Find the course for this round
              const course = courses.find(c => c.id === round.courseId);

              // Format date
              const date = new Date(round.date);
              const formattedDate = `${date.getMonth() + 1}/${date.getFullYear().toString().substr(2, 2)}`;

              // Default values
              let totalScore = 0;
              let netscore = 0;
              let teeColor = 'white';
              let rating = '—';
              let slope = '—';
              let par = 0;
              let scoreToPar = 0;

              // Find the player's data in roundPlayersData
              const playerData = roundPlayersData.find(rp => rp.round_id === round.id);

              if (playerData) {
                // Get total score directly from the database
                if (typeof playerData.total_score === 'number') {
                  totalScore = playerData.total_score;
                }
                if (typeof playerData.net_score === 'number') {
                  netscore = playerData.net_score;
                }
                
                // Get tee information
                if (playerData.tee_set_id && course?.tee_sets) {
                  const teeSet = course.tee_sets.find(t => t.id === playerData.tee_set_id);
                  if (teeSet) {
                    teeColor = teeSet.color || teeColor;
                    rating = teeSet.course_rating?.toString() || rating;
                    slope = teeSet.slope_rating?.toString() || slope;
                    par = teeSet.par || par;
                  }
                }
              }
              
              // Calculate score to par
              if (totalScore > 0 && par > 0) {
                scoreToPar = totalScore - par;
              }
              
              // Format score to par with + sign for positive numbers
              const scoreToParFormatted = scoreToPar === 0 
                ? 'E' 
                : scoreToPar > 0 
                  ? `+${scoreToPar}` 
                  : `${scoreToPar}`;
              
              // If we still don't have rating/slope but have a tee color, try to get it from the course
              if (rating === '—' && slope === '—' && course?.tee_sets) {
                const teeSet = course.tee_sets.find(t => t.color.toLowerCase() === teeColor.toLowerCase());
                if (teeSet) {
                  rating = teeSet.course_rating?.toString() || rating;
                  slope = teeSet.slope_rating?.toString() || slope;
                }
              }

              return (
                <TouchableOpacity
                  key={round.id}
                  style={[
                    styles.roundCard,
                    { backgroundColor: colors.card },
                    shadows.light
                  ]}
                  onPress={() => router.push(`/rounds/${round.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.roundCardContent}>
                    <Text style={[styles.roundDate, { color: colors.textSecondary }]}>
                      {formattedDate}
                    </Text>
                    <Text style={[styles.courseName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {course?.name || 'Unknown Course'} ({scoreToParFormatted})
                    </Text>
                    <View style={styles.roundDetailsRow}>
                      <View style={[styles.teeColorDot, { backgroundColor: teeColor }]} />
                      <Text style={[styles.teeDetails, { color: colors.textSecondary }]}>
                        {rating}/{slope}
                      </Text>
                      <View style={styles.scoreContainer}>
                        {isLoadingScores ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <Text style={[styles.scoreText, { color: colors.textPrimary }]}>
                            {totalScore}{' '}
                            <Text
                              style={[
                                {
                                  fontStyle: 'italic',
                                  fontWeight: 'normal',
                                  color: netscore < par ? 'red': colors.textSecondary
                                }
                              ]}
                            >
                              ({netscore})
                            </Text>
                          </Text>

                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyStateContainer}>
            <FontAwesome5 name="golf-ball" size={40} color={colors.textSecondary} style={styles.emptyStateIcon} />
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No rounds played yet
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderNearbyCourses = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Nearby Courses</Text>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => router.push('/courses')}
        >
          <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {nearbyCourses.length > 0 ? (
        <Animated.FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.courseCardsContainer}
          data={nearbyCourses}
          keyExtractor={(item) => item.id}
          snapToInterval={CARD_WIDTH + SPACING}
          decelerationRate="fast"
          renderItem={({ item, index }) => {
            // Mock distance data
            const distance = Math.floor(Math.random() * 40) + 5;

            return (
              <TouchableOpacity
                style={[
                  styles.courseCard,
                  {
                    marginLeft: index === 0 ? SPACING : 0,
                    marginRight: SPACING
                  }
                ]}
                onPress={() => router.push(`/courses/${item.id}`)}
                activeOpacity={0.9}
              >
                <ImageBackground
                  source={{
                    uri: item.imageUrl ||
                      'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
                  }}
                  style={styles.courseCardImage}
                  imageStyle={styles.courseCardImageStyle}
                >
                  <View
                    style={styles.courseCardGradient}
                  >
                    <View style={styles.courseCardContent}>
                      <Text style={styles.courseCardName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <View style={styles.courseCardDetails}>
                        <View style={styles.courseCardDetailItem}>
                          <Ionicons name="location" size={14} color="#FFFFFF" />
                          <Text style={styles.courseCardDetailText}>
                            {distance} miles
                          </Text>
                        </View>
                        <View style={styles.courseCardDetailItem}>
                          <FontAwesome5 name="flag" size={12} color="#FFFFFF" />
                          <Text style={styles.courseCardDetailText}>
                            {item.hole_count || 18} holes
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="location" size={40} color={colors.textSecondary} style={styles.emptyStateIcon} />
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            No courses nearby
          </Text>
          <Button
            title="View All Courses"
            variant="primary"
            size="small"
            onPress={() => router.push('/courses')}
            style={styles.emptyStateButton}
          />
        </View>
      )}
    </View>
  );

  const renderFriendsSection = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Friends</Text>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => router.push('/players')}
        >
          <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Card variant="default" style={styles.friendsCard}>
        <View style={styles.friendsContent}>
          <View style={styles.friendsAvatarRow}>
            {friends.length > 0 ? (
              friends.slice(0, 6).map((friend, index) => (
                <View
                  key={friend.id}
                  style={[
                    styles.friendAvatarContainer,
                    { zIndex: 10 - index }
                  ]}
                >
                  {friend.profileImageUrl ? (
                    <Image
                      source={{ uri: friend.profileImageUrl }}
                      style={styles.friendAvatar}
                    />
                  ) : (
                    <View style={[styles.friendAvatar, { backgroundColor: colors.primary }]}>
                      <Text style={styles.friendInitials}>
                        {friend.name?.charAt(0) || 'G'}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.noFriendsContainer}>
                <Text style={[styles.noFriendsText, { color: colors.textSecondary }]}>
                  Add friends to see them here
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.inviteFriendsButton,
              { backgroundColor: colors.primary + '15' }
            ]}
            onPress={() => router.push('/players/invite')}
          >
            <Text style={[styles.inviteFriendsText, { color: colors.primary }]}>
              Invite Friends
            </Text>
            <Ionicons name="person-add" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </Card>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {renderHeader()}

      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: contentPaddingTop }
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        bounces={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressViewOffset={20}
          />
        }
      >
        {renderHandicapCard()}
        {renderRecentRounds()}
        {renderNearbyCourses()}
        {renderFriendsSection()}

        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    height: Platform.OS === 'ios' ? 120 : 100,
  },
  headerGradient: {
    flex: 1,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: 16,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatarContainer: {
    marginRight: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userTextContainer: {
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 2,
  },
  handicapCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    padding: 0,
  },
  handicapGradient: {
    borderRadius: 16,
    padding: 16,
  },
  handicapContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  handicapTextContainer: {
    flex: 1,
  },
  handicapLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  handicapValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  handicapValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginRight: 8,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  weatherContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.1)',
  },
  weatherIconContainer: {
    marginBottom: 4,
  },
  weatherTemp: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  weatherCondition: {
    fontSize: 12,
    marginBottom: 2,
  },
  weatherWind: {
    fontSize: 10,
  },
  recentRoundsContainer: {
    paddingBottom: 8,
  },
  roundCard: {
    width: 180,
    height: 100,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  roundCardContent: {
    flex: 1,
    padding: 12,
  },
  roundDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  courseName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  roundDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teeColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  teeDetails: {
    fontSize: 12,
    flex: 1,
  },
  scoreContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  courseCardsContainer: {
    paddingVertical: 8,
  },
  courseCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
  },
  courseCardImage: {
    width: '100%',
    height: '100%',
  },
  courseCardImageStyle: {
    borderRadius: 16,
  },
  courseCardGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  courseCardContent: {

  },
  courseCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  courseCardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseCardDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  courseCardDetailText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  friendsCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  friendsContent: {
    padding: 16,
  },
  friendsAvatarRow: {
    flexDirection: 'row',
    marginBottom: 16,
    height: 40,
  },
  friendAvatarContainer: {
    marginLeft: -8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 20,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  noFriendsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noFriendsText: {
    fontSize: 14,
  },
  inviteFriendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  inviteFriendsText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 16,
  },
  emptyStateIcon: {
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyStateText: {
    fontSize: 16,
    marginBottom: 16,
  },
  emptyStateButton: {
    minWidth: 180,
  },
  bottomSpacer: {
    height: Platform.OS === 'ios' ? 120 : 100,
  },
}); 