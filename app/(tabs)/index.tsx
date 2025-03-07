import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { FONTS, SIZES } from '../../constants/theme';
import { RootState, AppDispatch } from '../../store';
import { fetchPastRounds } from '../../store/slices/roundSlice';
import { fetchCourses } from '../../store/slices/courseSlice';
import { fetchPlayers } from '../../store/slices/playerSlice';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import { createFontStyle } from '../../utils/styleUtils';
import { useTheme } from '../../components/ThemeProvider';

export default function HomeScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { pastRounds, currentRound } = useSelector((state: RootState) => state.round);
  const { courses } = useSelector((state: RootState) => state.course);
  const { colors, shadows } = useTheme();

  useEffect(() => {
    if (user) {
      dispatch(fetchPastRounds(user.id));
      dispatch(fetchCourses());
      dispatch(fetchPlayers(user.id));
    }
  }, [user]);

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Start a Round</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={[styles.quickActionItem, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/new-round')}
        >
          <View style={[styles.quickActionIconContainer, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <FontAwesome5 name="golf-ball" size={24} color={colors.textLight} />
          </View>
          <Text style={[styles.quickActionText, { color: colors.textLight }]}>Start New Round</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionItem, { backgroundColor: colors.card, ...shadows.medium }]}
          onPress={() => router.push('/courses')}
        >
          <View style={[styles.quickActionIconContainer, { backgroundColor: colors.secondaryLight }]}>
            <FontAwesome5 name="flag" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Find Course</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCurrentRound = () => {
    if (!currentRound) return null;

    return (
      <Card variant="elevated" style={styles.currentRoundCard}>
        <View style={styles.currentRoundHeader}>
          <Text style={[styles.currentRoundTitle, { color: colors.primary }]}>Current Round</Text>
          <FontAwesome5 name="golf-ball" size={20} color={colors.primary} />
        </View>
        
        <View style={styles.currentRoundInfo}>
          <Text style={[styles.currentRoundCourseName, { color: colors.textPrimary }]}>
            {currentRound.course?.name || 'Unknown Course'}
          </Text>
          <Text style={[styles.currentRoundDetails, { color: colors.textSecondary }]}>
            {currentRound.players.length} Players • {
              currentRound.holeSelection === 'front9' ? 'Front 9' :
              currentRound.holeSelection === 'back9' ? 'Back 9' :
              currentRound.holeSelection === 'full18' ? 'Full 18' : 'Custom'
            }
          </Text>
        </View>
        
        <Button
          title="Continue Round"
          onPress={() => router.push('/rounds/currentRound')}
          style={styles.continueButton}
        />
      </Card>
    );
  };

  const renderRecentRounds = () => {
    if (pastRounds.length === 0) return null;

    return (
      <View style={styles.recentRoundsContainer}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Rounds</Text>
        {pastRounds.slice(0, 3).map((round) => (
          <Card
            key={round.id}
            onPress={() => router.push(`/rounds/${round.id}` as any)}
            style={styles.recentRoundCard}
          >
            <View style={styles.recentRoundHeader}>
              <Text style={[styles.recentRoundCourseName, { color: colors.textPrimary }]}>
                {round.course?.name || 'Unknown Course'}
              </Text>
              <Text style={[styles.recentRoundDate, { color: colors.textSecondary }]}>
                {new Date(round.date).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.recentRoundDetails}>
              <View style={styles.recentRoundInfo}>
                <FontAwesome5 name="users" size={14} color={colors.textSecondary} style={styles.recentRoundIcon} />
                <Text style={[styles.recentRoundPlayers, { color: colors.textSecondary }]}>
                  {round.players.length} Players
                </Text>
              </View>
              <View style={styles.recentRoundInfo}>
                <FontAwesome5 name="flag" size={14} color={colors.textSecondary} style={styles.recentRoundIcon} />
                <Text style={[styles.recentRoundType, { color: colors.textSecondary }]}>
                  {round.holeSelection === 'front9' ? 'Front 9' :
                   round.holeSelection === 'back9' ? 'Back 9' :
                   round.holeSelection === 'full18' ? 'Full 18' : 'Custom'}
                </Text>
              </View>
            </View>
          </Card>
        ))}
        
        {pastRounds.length > 3 && (
          <Button
            title="View All Rounds"
            variant="outline"
            onPress={() => router.push('/history')}
            style={styles.viewAllButton}
          />
        )}
      </View>
    );
  };

  const renderNearbyCourses = () => {
    if (courses.length === 0) return null;

    return (
      <View style={styles.nearbyCoursesContainer}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Nearby Courses</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.nearbyCoursesScroll}
        >
          {courses.slice(0, 5).map((course) => (
            <TouchableOpacity
              key={course.id}
              style={[styles.courseCard, { backgroundColor: colors.card, ...shadows.medium }]}
              onPress={() => router.push(`/courses/${course.id}` as any)}
            >
              {course.imageUrl ? (
                <Image
                  source={{ uri: course.imageUrl }}
                  style={styles.courseImage}
                  onError={() => {/* Handle image load error silently */}}
                />
              ) : (
                <View style={[styles.courseImage, styles.courseImageFallback, { backgroundColor: colors.secondaryLight }]}>
                  <Ionicons name="golf" size={40} color={colors.primary} />
                </View>
              )}
              <View style={styles.courseInfo}>
                <Text style={[styles.courseName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {course.name}
                </Text>
                <Text style={[styles.courseDetails, { color: colors.textSecondary }]}>
                  {(() => {
                    // Check for clubData property (from our new approach)
                    if (course.clubData && (course.clubData.city || course.clubData.state)) {
                      return `${course.clubData.city || ''}, ${course.clubData.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '');
                    }
                    
                    // Check for clubs property (from the old approach)
                    if (course.clubs && (course.clubs.city || course.clubs.state)) {
                      return `${course.clubs.city || ''}, ${course.clubs.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '');
                    }
                    
                    // Check for club_id property (it might be a direct reference)
                    if (course.club_id && typeof course.club_id === 'object') {
                      const clubData = course.club_id;
                      if (clubData.city || clubData.state) {
                        return `${clubData.city || ''}, ${clubData.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '');
                      }
                    }
                    
                    return 'Location unavailable';
                  })()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <Button
          title="View All Courses"
          variant="outline"
          onPress={() => router.push('/courses')}
          style={styles.viewAllButton}
        />
      </View>
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.textPrimary }]}>Hello, {user?.name || 'Golfer'}!</Text>
        <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>Ready for your next round?</Text>
      </View>

      {/* Quick Access Links */}
      <View style={styles.quickAccessContainer}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Access</Text>
        <View style={styles.quickAccessGrid}>
          <TouchableOpacity 
            style={styles.quickAccessItem}
            onPress={() => router.push('/courses')}
          >
            <View style={[styles.quickAccessIconContainer, { backgroundColor: colors.card, ...shadows.medium }]}>
              <FontAwesome5 name="flag" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.quickAccessText, { color: colors.textPrimary }]}>Courses</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAccessItem}
            onPress={() => router.push('/players')}
          >
            <View style={[styles.quickAccessIconContainer, { backgroundColor: colors.card, ...shadows.medium }]}>
              <FontAwesome5 name="users" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.quickAccessText, { color: colors.textPrimary }]}>Players</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAccessItem}
            onPress={() => router.push('/history')}
          >
            <View style={[styles.quickAccessIconContainer, { backgroundColor: colors.card, ...shadows.medium }]}>
              <FontAwesome5 name="history" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.quickAccessText, { color: colors.textPrimary }]}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderQuickActions()}
      {currentRound && renderCurrentRound()}
      {renderRecentRounds()}
      {renderNearbyCourses()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.padding,
    paddingBottom: SIZES.padding * 2,
  },
  header: {
    marginBottom: SIZES.padding * 1.5,
  },
  greeting: {
    ...createFontStyle(FONTS.h2),
    marginBottom: SIZES.base / 2,
  },
  subGreeting: {
    ...createFontStyle(FONTS.body3),
  },
  sectionTitle: {
    ...createFontStyle(FONTS.h3),
    marginBottom: SIZES.base * 1.5,
  },
  quickActionsContainer: {
    marginBottom: SIZES.padding * 1.5,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: '48%',
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.base * 2,
    alignItems: 'center',
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.base * 1.5,
  },
  quickActionText: {
    ...createFontStyle(FONTS.body4),
    fontWeight: '600',
  },
  currentRoundCard: {
    marginBottom: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
  },
  currentRoundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base * 1.5,
  },
  currentRoundTitle: {
    ...createFontStyle(FONTS.h3),
  },
  currentRoundInfo: {
    marginBottom: SIZES.base * 2,
  },
  currentRoundCourseName: {
    ...createFontStyle(FONTS.h4),
    marginBottom: SIZES.base / 2,
  },
  currentRoundDetails: {
    ...createFontStyle(FONTS.body4),
  },
  continueButton: {
    marginTop: SIZES.base,
  },
  recentRoundsContainer: {
    marginBottom: SIZES.padding * 1.5,
  },
  recentRoundCard: {
    marginBottom: SIZES.base * 1.5,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
  },
  recentRoundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base * 1.5,
  },
  recentRoundCourseName: {
    ...createFontStyle(FONTS.h4),
  },
  recentRoundDate: {
    ...createFontStyle(FONTS.body5),
  },
  recentRoundDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recentRoundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentRoundIcon: {
    marginRight: SIZES.base,
  },
  recentRoundPlayers: {
    ...createFontStyle(FONTS.body4),
  },
  recentRoundType: {
    ...createFontStyle(FONTS.body4),
  },
  viewAllButton: {
    marginTop: SIZES.padding,
  },
  nearbyCoursesContainer: {
    marginBottom: SIZES.padding * 1.5,
  },
  nearbyCoursesScroll: {
    paddingTop: SIZES.base,
    paddingBottom: SIZES.base,
  },
  courseCard: {
    width: 220,
    marginRight: SIZES.base * 2,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
  },
  courseImage: {
    width: '100%',
    height: 130,
  },
  courseImageFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseInfo: {
    padding: SIZES.padding,
  },
  courseName: {
    ...createFontStyle(FONTS.h4),
    marginBottom: SIZES.base / 2,
  },
  courseDetails: {
    ...createFontStyle(FONTS.body5),
  },
  quickAccessContainer: {
    marginBottom: SIZES.padding * 1.5,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.base * 1.5,
  },
  quickAccessItem: {
    alignItems: 'center',
    width: '30%',
  },
  quickAccessIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.base * 1.5,
  },
  quickAccessText: {
    ...createFontStyle(FONTS.body4),
    fontWeight: '500',
  },
}); 