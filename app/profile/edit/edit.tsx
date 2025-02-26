import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  TouchableOpacity
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SIZES, FONTS } from '../../../constants/theme';
import Button from '../../../components/Button';
import { AppDispatch, RootState } from '../../../store';
import { createFontStyle } from '../../../utils/styleUtils';

export default function EditProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);

  const [name, setName] = useState(user?.name || '');
  const [handicapIndex, setHandicapIndex] = useState(
    user?.handicapIndex !== undefined ? Math.abs(user.handicapIndex).toString() : ''
  );
  const [isPlusHandicap, setIsPlusHandicap] = useState(
    user?.handicapIndex !== undefined ? user.handicapIndex < 0 : false
  );

  const togglePlusHandicap = () => {
    setIsPlusHandicap(prev => !prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate inputs
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    let handicap = handicapIndex ? parseFloat(handicapIndex) : undefined;
    if (handicapIndex && (isNaN(handicap!) || handicap! < 0 || handicap! > 54)) {
      Alert.alert('Error', 'Please enter a valid handicap index (0-54)');
      return;
    }

    // Apply plus handicap (negative value) if toggle is on
    if (handicap !== undefined && isPlusHandicap) {
      handicap = -handicap;
    }

    try {
      // In a real app, you would dispatch an action to update the user profile
      // For example: dispatch(updateProfile({ id: user.id, name, handicapIndex: handicap }));
      
      // Simulate success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Edit Profile' }} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Updating profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Edit Profile' }} />
      
      <View style={styles.formContainer}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor={COLORS.textSecondary}
        />
        
        <Text style={styles.label}>Handicap Index</Text>
        <View style={styles.handicapContainer}>
          <View style={styles.toggleContainer}>
            <Switch
              trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
              thumbColor={isPlusHandicap ? COLORS.primary : COLORS.textSecondary}
              ios_backgroundColor={COLORS.border}
              onValueChange={togglePlusHandicap}
              value={isPlusHandicap}
            />
            <Text style={styles.toggleLabel}>(+)</Text>
          </View>
          <TextInput
            style={styles.handicapInput}
            value={handicapIndex}
            onChangeText={setHandicapIndex}
            placeholder="Enter your handicap index"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.handicapInfoContainer}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.handicapInfoText}>
            Toggle (+) if you play better than scratch (e.g., +2.1 instead of 2.1)
          </Text>
        </View>
        
        <Button
          title="Save Changes"
          onPress={handleSave}
          style={styles.saveButton}
        />
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
    marginTop: SIZES.base,
    color: COLORS.textPrimary,
    ...createFontStyle('regular', SIZES.body4),
  },
  formContainer: {
    padding: SIZES.padding,
  },
  label: {
    ...createFontStyle('medium', SIZES.body4),
    color: COLORS.textPrimary,
    marginBottom: SIZES.base,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding / 2,
    marginBottom: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    ...createFontStyle('regular', SIZES.body4),
  },
  handicapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SIZES.base,
  },
  toggleLabel: {
    ...createFontStyle('medium', SIZES.body4),
    color: COLORS.textPrimary,
    marginLeft: 4,
    marginRight: 8,
  },
  handicapInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding / 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    ...createFontStyle('regular', SIZES.body4),
  },
  handicapInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding,
    paddingHorizontal: SIZES.base,
  },
  handicapInfoText: {
    ...createFontStyle('regular', SIZES.body5),
    color: COLORS.textSecondary,
    marginLeft: SIZES.base / 2,
    flex: 1,
  },
  saveButton: {
    marginTop: SIZES.padding,
  },
}); 