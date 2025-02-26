import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Switch
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS, SIZES, FONTS } from '../../constants/theme';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { AppDispatch, RootState } from '../../store';
import { createFontStyle } from '../../utils/styleUtils';

export default function HandicapSettingsScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);

  const [autoCalculate, setAutoCalculate] = useState(true);
  const [showHandicap, setShowHandicap] = useState(true);

  const toggleSwitch = (setting: string) => {
    switch (setting) {
      case 'autoCalculate':
        setAutoCalculate(prev => !prev);
        break;
      case 'showHandicap':
        setShowHandicap(prev => !prev);
        break;
      default:
        break;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      // In a real app, you would dispatch an action to update the handicap settings
      // For example: dispatch(updateHandicapSettings({ autoCalculate, showHandicap }));
      
      // Simulate success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Handicap settings updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update handicap settings');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Handicap Settings' }} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading handicap settings...</Text>
      </View>
    );
  }

  // Mock data for recent rounds
  const recentRounds = [
    { id: '1', date: '2023-06-15', course: 'Pine Valley Golf Club', score: 82, differential: 9.2 },
    { id: '2', date: '2023-06-08', course: 'Augusta National', score: 85, differential: 10.8 },
    { id: '3', date: '2023-05-30', course: 'Pebble Beach', score: 79, differential: 7.5 },
    { id: '4', date: '2023-05-22', course: 'St Andrews Links', score: 83, differential: 9.8 },
    { id: '5', date: '2023-05-15', course: 'Oakmont Country Club', score: 81, differential: 8.9 },
  ];

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Handicap Settings' }} />
      
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Handicap Index</Text>
        <Text style={styles.handicapValue}>{user?.handicapIndex?.toFixed(1) || 'N/A'}</Text>
        <Text style={styles.lastUpdated}>Last updated: June 15, 2023</Text>
      </View>
      
      <Card style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>Auto-calculate handicap</Text>
            <Text style={styles.settingDescription}>
              Automatically update your handicap index after each round
            </Text>
          </View>
          <Switch
            trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
            thumbColor={autoCalculate ? COLORS.primary : COLORS.textSecondary}
            ios_backgroundColor={COLORS.border}
            onValueChange={() => toggleSwitch('autoCalculate')}
            value={autoCalculate}
          />
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.settingItem}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>Show handicap to others</Text>
            <Text style={styles.settingDescription}>
              Display your handicap index on your profile
            </Text>
          </View>
          <Switch
            trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
            thumbColor={showHandicap ? COLORS.primary : COLORS.textSecondary}
            ios_backgroundColor={COLORS.border}
            onValueChange={() => toggleSwitch('showHandicap')}
            value={showHandicap}
          />
        </View>
      </Card>
      
      <Card style={styles.roundsCard}>
        <Text style={styles.sectionTitle}>Recent Rounds</Text>
        
        {recentRounds.map((round) => (
          <View key={round.id} style={styles.roundItem}>
            <View style={styles.roundInfo}>
              <Text style={styles.roundCourse}>{round.course}</Text>
              <Text style={styles.roundDate}>{round.date}</Text>
            </View>
            <View style={styles.roundScores}>
              <Text style={styles.roundScore}>{round.score}</Text>
              <Text style={styles.roundDifferential}>Diff: {round.differential}</Text>
            </View>
          </View>
        ))}
        
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All Rounds</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </Card>
      
      <Button
        title="Save Changes"
        onPress={handleSave}
        style={styles.saveButton}
      />
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
    marginTop: SIZES.base,
    color: COLORS.textPrimary,
    ...createFontStyle('regular', SIZES.body4),
  },
  headerContainer: {
    padding: SIZES.padding,
    alignItems: 'center',
  },
  title: {
    ...createFontStyle('medium', SIZES.h3),
    color: COLORS.textPrimary,
    marginBottom: SIZES.base,
  },
  handicapValue: {
    ...createFontStyle('bold', SIZES.h1),
    color: COLORS.primary,
    marginBottom: SIZES.base,
  },
  lastUpdated: {
    ...createFontStyle('regular', SIZES.body5),
    color: COLORS.textSecondary,
  },
  settingsCard: {
    marginHorizontal: SIZES.padding,
    marginBottom: SIZES.padding,
    padding: SIZES.padding,
  },
  sectionTitle: {
    ...createFontStyle('medium', SIZES.body3),
    color: COLORS.textPrimary,
    marginBottom: SIZES.padding,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.padding,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: SIZES.padding,
  },
  settingLabel: {
    ...createFontStyle('medium', SIZES.body4),
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  settingDescription: {
    ...createFontStyle('regular', SIZES.body5),
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SIZES.padding,
  },
  roundsCard: {
    marginHorizontal: SIZES.padding,
    marginBottom: SIZES.padding,
    padding: SIZES.padding,
  },
  roundItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  roundInfo: {
    flex: 1,
  },
  roundCourse: {
    ...createFontStyle('medium', SIZES.body4),
    color: COLORS.textPrimary,
  },
  roundDate: {
    ...createFontStyle('regular', SIZES.body5),
    color: COLORS.textSecondary,
  },
  roundScores: {
    alignItems: 'flex-end',
  },
  roundScore: {
    ...createFontStyle('medium', SIZES.body4),
    color: COLORS.textPrimary,
  },
  roundDifferential: {
    ...createFontStyle('regular', SIZES.body5),
    color: COLORS.textSecondary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.padding,
  },
  viewAllText: {
    ...createFontStyle('medium', SIZES.body4),
    color: COLORS.primary,
    marginRight: 4,
  },
  saveButton: {
    margin: SIZES.padding,
  },
}); 