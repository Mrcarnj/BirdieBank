import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesome5 } from '@expo/vector-icons';
import { FONTS, SIZES } from '../../constants/theme';
import { RootState, AppDispatch, store } from '../../store';
import { Course, selectCourse, fetchCourseById } from '../../store/slices/courseSlice';
import Card from '../Card';
import { createFontStyle } from '../../utils/styleUtils';
import { useTheme } from '../ThemeProvider';

interface CourseSelectionProps {
  onCourseSelect: (course: Course) => void;
}

const CourseSelection: React.FC<CourseSelectionProps> = ({ onCourseSelect }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { courses, nearbyCourses } = useSelector((state: RootState) => state.course);
  const { colors } = useTheme();

  const handleCourseSelect = (course: Course) => {
    // Create a safe copy of the course with default values for optional properties
    const safeCourse = {
      ...course,
      holes: course.holes || [],
      tee_sets: course.tee_sets || []
    };
    
    // Select the course in the Redux store
    dispatch(selectCourse(safeCourse));
    
    // Fetch detailed course data if needed
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
    
    // Call the parent component's onCourseSelect callback
    onCourseSelect(safeCourse);
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Select Course</Text>
      
      {nearbyCourses && nearbyCourses.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Nearby Courses</Text>
          {nearbyCourses.map(course => (
            <Card
              key={course.id}
              onPress={() => handleCourseSelect(course)}
              style={styles.courseCard}
            >
              <View style={styles.courseHeader}>
                <Text style={[styles.courseName, { color: colors.textPrimary }]}>{course.name}</Text>
                <FontAwesome5 name="map-marker-alt" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.courseDetails, { color: colors.textSecondary }]}>
                {(course.holes || []).length} holes • {(course.tee_sets || []).length} tee options
              </Text>
            </Card>
          ))}
        </View>
      )}
      
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>All Courses</Text>
        {courses && courses.length > 0 ? (
          courses.map(course => (
            <Card
              key={course.id}
              onPress={() => handleCourseSelect(course)}
              style={styles.courseCard}
            >
              <View style={styles.courseHeader}>
                <Text style={[styles.courseName, { color: colors.textPrimary }]}>{course.name}</Text>
              </View>
              <Text style={[styles.courseDetails, { color: colors.textSecondary }]}>
                {(course.holes || []).length} holes • {(course.tee_sets || []).length} tee options
              </Text>
            </Card>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No courses available. Please check your connection and try again.
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    ...createFontStyle(FONTS.h2),
    marginBottom: SIZES.padding,
  },
  sectionContainer: {
    marginBottom: SIZES.padding * 2,
  },
  sectionTitle: {
    ...createFontStyle(FONTS.h3),
    marginBottom: SIZES.padding,
  },
  courseCard: {
    marginBottom: SIZES.base,
    padding: SIZES.padding,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base / 2,
  },
  courseName: {
    ...createFontStyle(FONTS.h4),
  },
  courseDetails: {
    ...createFontStyle(FONTS.body4),
  },
  emptyText: {
    ...createFontStyle(FONTS.body4),
    textAlign: 'center',
    marginTop: SIZES.padding,
  },
});

export default CourseSelection;
