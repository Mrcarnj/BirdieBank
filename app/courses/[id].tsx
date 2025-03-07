import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Linking, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';

import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { RootState, AppDispatch } from '../../store';
import { fetchCourseById, TeeSet } from '../../store/slices/courseSlice';
import { createFontStyle } from '../../utils/styleUtils';
import Button from '../../components/Button';
import { useTheme } from '../../components/ThemeProvider';

export default function CourseDetailsScreen() {
  const { id } = useLocalSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedCourse, isLoading, error } = useSelector((state: RootState) => state.course);
  const { colors, shadows } = useTheme();

  // If the ID is 'index', we should not render this component at all
  if (id === 'index') {
    return null;
  }

  useEffect(() => {
    if (id) {
      dispatch(fetchCourseById(id as string));
    }
  }, [id, dispatch]);

  const handlePhonePress = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleWebsitePress = (url: string) => {
    // Add https:// if not present
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(formattedUrl);
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Course Details' }} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Loading course details...</Text>
      </View>
    );
  }

  if (error || !selectedCourse) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Course Not Found' }} />
        <View style={[styles.errorIconContainer, { backgroundColor: colors.secondaryLight }]}>
          <Ionicons name="alert-circle-outline" size={60} color={colors.primary} />
        </View>
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>Course not found</Text>
        <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
          {error || "The course you're looking for doesn't exist or has been removed."}
        </Text>
        <Button 
          title="Back to Courses" 
          variant="outline"
          onPress={() => router.back()} 
          style={styles.secondaryButton}
        />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          title: selectedCourse.clubData?.name || 'Course Details',
          headerShown: true,
          headerBackTitle: 'Home',
          headerLeft: () => (
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center' }}
              onPress={() => router.push('/(tabs)')}
            >
              <Ionicons name="chevron-back" size={24} color={colors.textLight} />
              <Text style={{ color: colors.textLight, marginLeft: 5 }}>Home</Text>
            </TouchableOpacity>
          ),
        }} 
      />
      
      {selectedCourse.imageUrl ? (
        <Image source={{ uri: selectedCourse.imageUrl }} style={styles.courseImage} />
      ) : (
        <View style={[styles.placeholderImage, { backgroundColor: colors.secondaryLight }]}>
          <Ionicons name="golf" size={60} color={colors.primary} />
        </View>
      )}
      
      <View style={styles.contentContainer}>
        <View style={styles.courseNameContainer}>
          <Text style={[styles.courseName, { color: colors.textPrimary, textAlign: 'center' }]}>
            {selectedCourse.name}
          </Text>
        </View>
        
        {/* Course Information */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Course Information</Text>
          
          {/* Location */}
          {selectedCourse.clubData && (
            <>
              {/* Address */}
              <View style={styles.infoRow}>
                <View style={[styles.iconContainer, { backgroundColor: colors.secondaryLight }]}>
                  <Ionicons name="location-outline" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.infoText, { color: colors.textPrimary }]}>
                  {(() => {
                    // Try to get location from clubData
                    if (selectedCourse.clubData) {
                      const { city, state } = selectedCourse.clubData;
                      const address = selectedCourse.clubData.address;
                      const parts = [address, city, state].filter(Boolean);
                      return parts.join(', ');
                    }
                    
                    // Fall back to location.address
                    if (selectedCourse.location?.address) {
                      return selectedCourse.location.address;
                    }
                    
                    // Fall back to clubs data
                    if (selectedCourse.clubs) {
                      const { city, state } = selectedCourse.clubs;
                      const parts = [city, state].filter(Boolean);
                      return parts.join(', ');
                    }
                    
                    return 'Location unavailable';
                  })()}
                </Text>
              </View>
              
              {/* Phone */}
              {selectedCourse.clubData.phone && (
                <TouchableOpacity 
                  style={styles.infoRow}
                  onPress={() => handlePhonePress(selectedCourse.clubData?.phone || '')}
                >
                  <View style={[styles.iconContainer, { backgroundColor: colors.secondaryLight }]}>
                    <Ionicons name="call-outline" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.infoText, { color: colors.primary }]}>
                    {selectedCourse.clubData.phone}
                  </Text>
                </TouchableOpacity>
              )}
              
              {/* Website */}
              {selectedCourse.clubData?.website_url ? (
                <TouchableOpacity 
                  style={styles.infoRow}
                  onPress={() => handleWebsitePress(selectedCourse.clubData?.website_url || '')}
                >
                  <View style={[styles.iconContainer, { backgroundColor: colors.secondaryLight }]}>
                    <Ionicons name="globe-outline" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.infoText, { color: colors.primary }]}>
                    View Website
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.infoRow}>
                  <View style={[styles.iconContainer, { backgroundColor: colors.secondaryLight }]}>
                    <Ionicons name="globe-outline" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.infoText, { color: colors.textSecondary, fontStyle: 'italic' }]}>
                    No website available
                  </Text>
                </View>
              )}
            </>
          )}
          
          {/* Hole Count */}
          <View style={styles.infoRow}>
            <View style={[styles.iconContainer, { backgroundColor: colors.secondaryLight }]}>
              <FontAwesome5 name="flag" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.infoText, { color: colors.textPrimary }]}>
              {selectedCourse.hole_count || (selectedCourse.holes && selectedCourse.holes.length) || 'Unknown'} Holes
            </Text>
          </View>
        </View>
        
        {/* Tees Section */}
        {selectedCourse.tee_sets && selectedCourse.tee_sets.length > 0 && (
          <View style={[styles.sectionContainer, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Tee Sets</Text>
            
            {/* Tee Set Headers */}
            <View style={styles.teeSetHeaderRow}>
              <Text style={[styles.teeSetHeaderCell, styles.teeSetNameHeader, { color: colors.textSecondary }]}>Tee</Text>
              <Text style={[styles.teeSetHeaderCell, { color: colors.textSecondary }]}>Par</Text>
              <Text style={[styles.teeSetHeaderCell, { color: colors.textSecondary }]}>Rating</Text>
              <Text style={[styles.teeSetHeaderCell, { color: colors.textSecondary }]}>Slope</Text>
              <Text style={[styles.teeSetHeaderCell, { color: colors.textSecondary }]}>Yards</Text>
            </View>
            
            {/* Tee Sets */}
            {selectedCourse.tee_sets.map((teeSet: TeeSet) => (
              <View key={teeSet.id} style={styles.teeSetRow}>
                <View style={styles.teeSetNameCell}>
                  <View 
                    style={[
                      styles.teeColorIndicator, 
                      { backgroundColor: teeSet.color || colors.primary },
                      teeSet.color === '#FFFFFF' ? { borderWidth: 1, borderColor: 'rgba(0,0,0,0.3)' } : {}
                    ]} 
                  />
                  <Text style={[styles.teeSetName, { color: colors.textPrimary }]}>
                    {teeSet.name}
                  </Text>
                </View>
                <Text style={[styles.teeSetCell, { color: colors.textPrimary }]}>
                  {teeSet.par || '-'}
                </Text>
                <Text style={[styles.teeSetCell, { color: colors.textPrimary }]}>
                  {teeSet.course_rating || '-'}
                </Text>
                <Text style={[styles.teeSetCell, { color: colors.textPrimary }]}>
                  {teeSet.slope_rating || '-'}
                </Text>
                <Text style={[styles.teeSetCell, { color: colors.textPrimary }]}>
                  {teeSet.total_yardage || '-'}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <Button 
            title="Start New Round" 
            onPress={() => {
              // Navigate to new round screen with this course
              router.push(`/(tabs)/new-round?courseId=${selectedCourse.id}`);
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...createFontStyle(FONTS.body3),
    marginTop: SIZES.base * 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.base * 2,
    ...SHADOWS.medium,
  },
  errorText: {
    ...createFontStyle(FONTS.h3),
    marginBottom: SIZES.base,
  },
  errorSubtext: {
    ...createFontStyle(FONTS.body4),
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: SIZES.padding * 0.8,
  },
  courseNameContainer: {
    marginBottom: SIZES.base * 1.5,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: SIZES.padding,
  },
  courseName: {
    ...createFontStyle(FONTS.h3),
  },
  sectionContainer: {
    marginBottom: SIZES.padding,
    borderRadius: SIZES.radius,
    padding: SIZES.padding * 0.8,
    ...SHADOWS.light,
  },
  sectionTitle: {
    ...createFontStyle(FONTS.h3),
    marginBottom: SIZES.base * 1.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.base,
  },
  infoText: {
    ...createFontStyle(FONTS.body4),
    flex: 1,
  },
  teeSetHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    paddingBottom: SIZES.base * 0.5,
    marginBottom: SIZES.base * 0.5,
  },
  teeSetHeaderCell: {
    ...createFontStyle(FONTS.body5),
    flex: 1,
    textAlign: 'center',
  },
  teeSetNameHeader: {
    flex: 2,
    textAlign: 'left',
  },
  teeSetRow: {
    flexDirection: 'row',
    paddingVertical: SIZES.base * 0.7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  teeSetNameCell: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teeColorIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: SIZES.base,
  },
  teeSetName: {
    ...createFontStyle(FONTS.body4),
  },
  teeSetCell: {
    flex: 1,
    ...createFontStyle(FONTS.body4),
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: SIZES.padding,
  },
  button: {
    marginBottom: SIZES.base,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.base,
  },
  infoItem: {
    flex: 1,
    padding: SIZES.base,
  },
  infoLabel: {
    ...createFontStyle(FONTS.body4),
    marginBottom: SIZES.base / 2,
  },
  infoValue: {
    ...createFontStyle(FONTS.h4),
    fontWeight: '600',
  },
}); 