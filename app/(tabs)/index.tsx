import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { RootState, AppDispatch } from '../../store';
import { fetchPastRounds } from '../../store/slices/roundSlice';
import { fetchCourses } from '../../store/slices/courseSlice';
import { fetchPlayers } from '../../store/slices/playerSlice';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function HomeScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { pastRounds, currentRound } = useSelector((state: RootState) => state.round);
  const { courses } = useSelector((state: RootState) => state.course);

  useEffect(() => {
    if (user) {
      dispatch(fetchPastRounds(user.id));
      dispatch(fetchCourses());
      dispatch(fetchPlayers(user.id));
    }
  }, [user]);

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={styles.quickActionItem}
          onPress={() => router.push('/(tabs)/new-round')}
        >
          <View style={styles.quickActionIconContainer}>
            <FontAwesome5 name="golf-ball" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.quickActionText}>Start Round</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionItem}
          onPress={() => router.push('/(tabs)/courses')}
        >
          <View style={styles.quickActionIconContainer}>
            <FontAwesome5 name="flag" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.quickActionText}>Find Course</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionItem}
          onPress={() => router.push('/(tabs)/history')}
        >
          <View style={styles.quickActionIconContainer}>
            <FontAwesome5 name="history" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.quickActionText}>View History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionItem}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <View style={styles.quickActionIconContainer}>
            <FontAwesome5 name="user" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.quickActionText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCurrentRound = () => {
    if (!currentRound) return null;

    return (
      <Card variant="elevated" style={styles.currentRoundCard}>
        <View style={styles.currentRoundHeader}>
          <Text style={styles.currentRoundTitle}>Current Round</Text>
          <FontAwesome5 name="golf-ball" size={20} color={COLORS.primary} />
        </View>
        
        <View style={styles.currentRoundInfo}>
          <Text style={styles.currentRoundCourseName}>
            {currentRound.course?.name || 'Unknown Course'}
          </Text>
          <Text style={styles.currentRoundDetails}>
            {currentRound.players.length} Players • {
              currentRound.holeSelection === 'front9' ? 'Front 9' :
              currentRound.holeSelection === 'back9' ? 'Back 9' :
              currentRound.holeSelection === 'full18' ? 'Full 18' : 'Custom'
            }
          </Text>
        </View>
        
        <Button
          title="Continue Round"
          onPress={() => router.push('/(tabs)/round')}
          style={styles.continueButton}
        />
      </Card>
    );
  };

  const renderRecentRounds = () => {
    if (pastRounds.length === 0) return null;

    return (
      <View style={styles.recentRoundsContainer}>
        <Text style={styles.sectionTitle}>Recent Rounds</Text>
        {pastRounds.slice(0, 3).map((round) => (
          <Card
            key={round.id}
            onPress={() => router.push(`/rounds/${round.id}`)}
            style={styles.recentRoundCard}
          >
            <View style={styles.recentRoundHeader}>
              <Text style={styles.recentRoundCourseName}>
                {round.course?.name || 'Unknown Course'}
              </Text>
              <Text style={styles.recentRoundDate}>
                {new Date(round.date).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.recentRoundDetails}>
              <Text style={styles.recentRoundPlayers}>
                {round.players.length} Players
              </Text>
              <Text style={styles.recentRoundType}>
                {round.holeSelection === 'front9' ? 'Front 9' :
                 round.holeSelection === 'back9' ? 'Back 9' :
                 round.holeSelection === 'full18' ? 'Full 18' : 'Custom'}
              </Text>
            </View>
          </Card>
        ))}
        
        {pastRounds.length > 3 && (
          <Button
            title="View All Rounds"
            variant="outline"
            onPress={() => router.push('/(tabs)/history')}
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
        <Text style={styles.sectionTitle}>Nearby Courses</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.nearbyCoursesScroll}
        >
          {courses.slice(0, 5).map((course) => (
            <TouchableOpacity
              key={course.id}
              style={styles.courseCard}
              onPress={() => router.push(`/courses/${course.id}`)}
            >
              <Image
                source={
                  course.imageUrl
                    ? { uri: course.imageUrl }
                    : require('../../assets/default-course.jpg')
                }
                style={styles.courseImage}
              />
              <View style={styles.courseInfo}>
                <Text style={styles.courseName} numberOfLines={1}>
                  {course.name}
                </Text>
                <Text style={styles.courseDetails}>
                  {course.holes.length} holes
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hello, {user?.email?.split('@')[0] || 'Golfer'}
        </Text>
        <Text style={styles.subGreeting}>Ready for your next round?</Text>
      </View>

      {renderCurrentRound()}
      {renderQuickActions()}
      {renderRecentRounds()}
      {renderNearbyCourses()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SIZES.padding,
  },
  header: {
    marginBottom: SIZES.padding,
  },
  greeting: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
  },
  subGreeting: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    marginBottom: SIZES.base,
  },
  quickActionsContainer: {
    marginVertical: SIZES.padding,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: '48%',
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.base * 2,
    alignItems: 'center',
    ...SHADOWS.light,
  },
  quickActionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  quickActionText: {
    ...FONTS.body4,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  currentRoundCard: {
    backgroundColor: COLORS.secondaryLight,
    marginVertical: SIZES.base,
  },
  currentRoundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  currentRoundTitle: {
    ...FONTS.h3,
    color: COLORS.primary,
  },
  currentRoundInfo: {
    marginBottom: SIZES.base * 2,
  },
  currentRoundCourseName: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  currentRoundDetails: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
  },
  continueButton: {
    marginTop: SIZES.base,
  },
  recentRoundsContainer: {
    marginVertical: SIZES.padding,
  },
  recentRoundCard: {
    marginBottom: SIZES.base,
  },
  recentRoundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  recentRoundCourseName: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  recentRoundDate: {
    ...FONTS.body5,
    color: COLORS.textSecondary,
  },
  recentRoundDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recentRoundPlayers: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
  },
  recentRoundType: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
  },
  viewAllButton: {
    marginTop: SIZES.base,
  },
  nearbyCoursesContainer: {
    marginVertical: SIZES.padding,
  },
  nearbyCoursesScroll: {
    paddingRight: SIZES.padding,
  },
  courseCard: {
    width: 200,
    marginRight: SIZES.base * 2,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.secondary,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  courseImage: {
    width: '100%',
    height: 120,
  },
  courseInfo: {
    padding: SIZES.base,
  },
  courseName: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  courseDetails: {
    ...FONTS.body5,
    color: COLORS.textSecondary,
  },
}); 