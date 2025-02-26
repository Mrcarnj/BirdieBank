import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import * as Haptics from 'expo-haptics';

import { COLORS, SIZES, FONTS } from '../../constants/theme';
import Button from '../../components/Button';
import { AppDispatch, RootState } from '../../store';
import { createFontStyle } from '../../utils/styleUtils';

export default function EditProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);

  const [name, setName] = useState(user?.name || '');
  const [handicapIndex, setHandicapIndex] = useState(
    user?.handicapIndex !== undefined ? user.handicapIndex.toString() : ''
  );

  const handleSave = async () => {
    if (!user) return;

    // Validate inputs
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    const handicap = handicapIndex ? parseFloat(handicapIndex) : undefined;
    if (handicapIndex && (isNaN(handicap!) || handicap! < 0 || handicap! > 54)) {
      Alert.alert('Error', 'Please enter a valid handicap index (0-54)');
      return;
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
        <TextInput
          style={styles.input}
          value={handicapIndex}
          onChangeText={setHandicapIndex}
          placeholder="Enter your handicap index"
          placeholderTextColor={COLORS.textSecondary}
          keyboardType="numeric"
        />
        
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
  saveButton: {
    marginTop: SIZES.padding,
  },
}); 