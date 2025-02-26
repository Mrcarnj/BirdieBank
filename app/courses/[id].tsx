import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { RootState } from '../../store';
import { createFontStyle } from '../../utils/styleUtils';
import Button from '../../components/Button';

interface CourseLocation {
  address?: string;
  latitude?: number;
  longitude?: number;
}

interface CourseTee {
  name: string;
  color?: string;
}

interface Course {
  id: string;
  name: string;
  location?: CourseLocation;
  imageUrl?: string;
  tees?: CourseTee[];
}

export default function CourseDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch the course details from your API or Redux store
    // For now, we'll simulate loading
    const timer = setTimeout(() => {
      // Mock data - replace with actual data fetching
      setCourse({
        id: id as string,
        name: 'Sample Golf Course',
        location: {
          address: '123 Fairway Drive, Golf City',
          latitude: 37.7749,
          longitude: -122.4194,
        },
        imageUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
        tees: [
          { name: 'Pro', color: '#000000' },
          { name: 'Championship', color: '#0000FF' },
          { name: 'Regular', color: '#FFFFFF' },
          { name: 'Senior', color: '#FF0000' },
        ]
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Course Details' }} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading course details...</Text>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ title: 'Course Not Found' }} />
        <View style={styles.errorIconContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={COLORS.primary} />
        </View>
        <Text style={styles.errorText}>Course not found</Text>
        <Text style={styles.errorSubtext}>The course you're looking for doesn't exist or has been removed.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: course.name }} />
      
      {course.imageUrl ? (
        <Image source={{ uri: course.imageUrl }} style={styles.courseImage} />
      ) : (
        <View style={styles.placeholderImage}>
          <Ionicons name="golf" size={60} color={COLORS.primary} />
        </View>
      )}
      
      <View style={styles.contentContainer}>
        <Text style={styles.courseName}>{course.name}</Text>
        
        {course.location?.address && (
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.infoText}>{course.location.address}</Text>
          </View>
        )}
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Tees</Text>
          <View style={styles.teeContainer}>
            {course.tees?.map((tee, index) => (
              <View 
                key={index} 
                style={[styles.teeBadge, { backgroundColor: tee.color || COLORS.primary }]}
              >
                <Text style={[
                  styles.teeBadgeText, 
                  { color: tee.color === '#FFFFFF' ? COLORS.textPrimary : COLORS.secondary }
                ]}>
                  {tee.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button 
            title="Start New Round" 
            onPress={() => {
              // Navigate to new round screen with this course
              router.push(`/(tabs)/new-round?courseId=${course.id}`);
            }} 
            style={styles.button}
          />
          <Button 
            title="Back to Courses" 
            variant="outline"
            onPress={() => router.back()} 
            style={styles.secondaryButton}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    ...createFontStyle(FONTS.body3),
    color: COLORS.textPrimary,
    marginTop: SIZES.base * 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.base * 2,
    ...SHADOWS.medium,
  },
  errorText: {
    ...createFontStyle(FONTS.h3),
    color: COLORS.textPrimary,
    marginBottom: SIZES.base,
  },
  errorSubtext: {
    ...createFontStyle(FONTS.body4),
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  courseImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: SIZES.padding,
  },
  courseName: {
    ...createFontStyle(FONTS.h2),
    color: COLORS.textPrimary,
    marginBottom: SIZES.base * 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.base,
  },
  infoText: {
    ...createFontStyle(FONTS.body3),
    color: COLORS.textPrimary,
    flex: 1,
  },
  sectionContainer: {
    marginTop: SIZES.padding,
    marginBottom: SIZES.base * 2,
    backgroundColor: COLORS.secondary,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    ...SHADOWS.light,
  },
  sectionTitle: {
    ...createFontStyle(FONTS.h4),
    color: COLORS.textPrimary,
    marginBottom: SIZES.base * 1.5,
  },
  teeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  teeBadge: {
    paddingHorizontal: SIZES.base * 1.5,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius / 2,
    marginRight: SIZES.base,
    marginBottom: SIZES.base,
    ...SHADOWS.light,
  },
  teeBadgeText: {
    ...createFontStyle(FONTS.body5),
    fontWeight: '600',
    color: COLORS.secondary,
  },
  buttonContainer: {
    marginTop: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  button: {
    marginBottom: SIZES.base * 2,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
  },
}); 