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
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

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
            <Text style={styles.detailValue}>{item.holes?.length || 18}</Text>
          </View>
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <FontAwesome5 name="golf-ball" size={14} color={COLORS.primary} />
            </View>
            <Text style={styles.detailLabel}>Par</Text>
            <Text style={styles.detailValue}>
              {item.holes?.reduce((total: number, hole: any) => total + hole.par, 0) || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <FontAwesome5 name="ruler-horizontal" size={14} color={COLORS.primary} />
            </View>
            <Text style={styles.detailLabel}>Tees</Text>
            <Text style={styles.detailValue}>{item.tees?.length || 0}</Text>
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
          headerRight: () => (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/courses/add' as any)}
            >
              <Ionicons name="add" size={24} color={COLORS.primary} />
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