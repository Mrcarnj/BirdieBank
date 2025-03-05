import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, Stack } from 'expo-router';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import Card from '../../components/Card';
import { fetchCourses } from '../../store/slices/courseSlice';
import { AppDispatch, RootState } from '../../store';
import { createFontStyle } from '../../utils/styleUtils';

export default function CoursesScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { courses, isLoading } = useSelector((state: RootState) => state.course);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchCourses());
    setRefreshing(false);
  };

  // Function to find the most common par value from tee sets
  const getMostCommonPar = (course: any) => {
    // If no tee_sets, fall back to holes calculation
    if (!course.tee_sets || course.tee_sets.length === 0) {
      return course.holes?.reduce((total: number, hole: any) => total + hole.par, 0) || 'N/A';
    }
    
    // Count occurrences of each par value
    const parCounts: Record<number, number> = {};
    course.tee_sets.forEach((teeSet: any) => {
      if (teeSet.par) {
        parCounts[teeSet.par] = (parCounts[teeSet.par] || 0) + 1;
      }
    });
    
    // If no par values found in tee_sets
    if (Object.keys(parCounts).length === 0) {
      return course.holes?.reduce((total: number, hole: any) => total + hole.par, 0) || 'N/A';
    }
    
    // Find the most common par value
    let mostCommonPar = 0;
    let highestCount = 0;
    
    Object.entries(parCounts).forEach(([par, count]) => {
      if (count > highestCount) {
        highestCount = count;
        mostCommonPar = parseInt(par);
      }
    });
    
    return mostCommonPar || 'N/A';
  };

  // Function to get the correct hole count
  const getHoleCount = (course: any) => {
    // First check if hole_count is explicitly set
    if (course.hole_count) {
      return course.hole_count;
    }
    
    // Then check if we have holes data
    if (course.holes && course.holes.length > 0) {
      return course.holes.length;
    }
    
    // If we have tee_sets, try to infer from there
    if (course.tee_sets && course.tee_sets.length > 0) {
      // Check if any tee set has front_nine_yardage but not back_nine_yardage
      const hasOnlyFrontNine = course.tee_sets.some(
        (teeSet: any) => teeSet.front_nine_yardage && !teeSet.back_nine_yardage
      );
      
      if (hasOnlyFrontNine) {
        return 9;
      }
      
      // Check total yardage - if it's typical for 9 holes
      const firstTeeWithYardage = course.tee_sets.find((teeSet: any) => teeSet.total_yardage);
      if (firstTeeWithYardage && firstTeeWithYardage.total_yardage < 4000) {
        return 9;
      }
    }
    
    // Default to 18 if we can't determine
    return 18;
  };

  // Function to count tee sets for a course
  const getTeeCount = (course: any) => {
    // Check if tee_sets exists and has items
    if (course.tee_sets && Array.isArray(course.tee_sets) && course.tee_sets.length > 0) {
      return course.tee_sets.length;
    }
    
    // Check if tees exists and has items
    if (course.tees && Array.isArray(course.tees) && course.tees.length > 0) {
      return course.tees.length;
    }
    
    return 0;
  };

  const renderCourseItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.courseItem}
      onPress={() => router.push(`/courses/${item.id}` as any)}
    >
      <Card style={styles.courseCard}>
        <View style={styles.courseHeader}>
          <Text style={styles.courseName}>{item.name}</Text>
          <FontAwesome5 name="chevron-right" size={16} color={COLORS.primary} />
        </View>
        <View style={styles.courseDetails}>
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <FontAwesome5 name="flag" size={14} color={COLORS.primary} />
            </View>
            <Text style={styles.detailLabel}>Holes</Text>
            <Text style={styles.detailValue}>{getHoleCount(item)}</Text>
          </View>
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <MaterialCommunityIcons name="golf-cart" size={14} color={COLORS.primary} />
            </View>
            <Text style={styles.detailLabel}>Par</Text>
            <Text style={styles.detailValue}>
              {getMostCommonPar(item)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <FontAwesome5 name="golf-ball" size={14} color={COLORS.primary} />
            </View>
            <Text style={styles.detailLabel}>Tees</Text>
            <Text style={styles.detailValue}>{getTeeCount(item)}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: "Golf Courses",
          headerShown: true,
          headerBackTitle: 'Home',
          headerLeft: () => (
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center' }}
              onPress={() => router.push('/(tabs)')}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.textLight} />
              <Text style={{ color: COLORS.textLight, marginLeft: 5 }}>Home</Text>
            </TouchableOpacity>
          ),
        }} 
      />

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          renderItem={renderCourseItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <FontAwesome5 name="flag" size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyText}>No courses found</Text>
              <Text style={styles.emptySubtext}>
                Add your favorite golf courses to get started
              </Text>
              <TouchableOpacity
                style={styles.addCourseButton}
                onPress={() => router.push('/courses/add' as any)}
              >
                <Text style={styles.addCourseButtonText}>Add Course</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  addButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.textPrimary,
    ...createFontStyle(FONTS.body3),
  },
  listContent: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 2,
  },
  courseItem: {
    marginBottom: SIZES.base * 2,
  },
  courseCard: {
    padding: SIZES.padding,
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radius,
    ...SHADOWS.medium,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base * 2,
  },
  courseName: {
    ...createFontStyle(FONTS.h4),
    color: COLORS.textPrimary,
  },
  courseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  detailLabel: {
    ...createFontStyle(FONTS.body5),
    color: COLORS.textSecondary,
    marginBottom: SIZES.base / 2,
  },
  detailValue: {
    ...createFontStyle(FONTS.h5),
    color: COLORS.textPrimary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
    marginTop: 100,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.base * 2,
    ...SHADOWS.light,
  },
  emptyText: {
    ...createFontStyle(FONTS.h3),
    color: COLORS.textPrimary,
    marginBottom: SIZES.base,
  },
  emptySubtext: {
    ...createFontStyle(FONTS.body4),
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  addCourseButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: SIZES.radius,
    ...SHADOWS.medium,
  },
  addCourseButtonText: {
    ...createFontStyle(FONTS.body4),
    fontWeight: '600',
    color: COLORS.secondary,
  },
}); 