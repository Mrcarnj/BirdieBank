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

export default function ChangePasswordScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSave = async () => {
    // Validate inputs
    if (!currentPassword.trim()) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    try {
      // In a real app, you would dispatch an action to update the password
      // For example: dispatch(updatePassword({ currentPassword, newPassword }));
      
      // Simulate success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Password updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update password');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Change Password' }} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Updating password...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Change Password' }} />
      
      <View style={styles.formContainer}>
        <Text style={styles.description}>
          Enter your current password and a new password to update your account security.
        </Text>
        
        <Text style={styles.label}>Current Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            placeholderTextColor={COLORS.textSecondary}
            secureTextEntry={!showCurrentPassword}
          />
          <Button
            title={showCurrentPassword ? "Hide" : "Show"}
            onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            variant="text"
            style={styles.showButton}
          />
        </View>
        
        <Text style={styles.label}>New Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            placeholderTextColor={COLORS.textSecondary}
            secureTextEntry={!showNewPassword}
          />
          <Button
            title={showNewPassword ? "Hide" : "Show"}
            onPress={() => setShowNewPassword(!showNewPassword)}
            variant="text"
            style={styles.showButton}
          />
        </View>
        
        <Text style={styles.label}>Confirm New Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor={COLORS.textSecondary}
            secureTextEntry={!showConfirmPassword}
          />
          <Button
            title={showConfirmPassword ? "Hide" : "Show"}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            variant="text"
            style={styles.showButton}
          />
        </View>
        
        <Text style={styles.passwordRequirements}>
          Password must be at least 8 characters long and include a mix of letters, numbers, and special characters.
        </Text>
        
        <Button
          title="Update Password"
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
  description: {
    ...createFontStyle('regular', SIZES.body4),
    color: COLORS.textPrimary,
    marginBottom: SIZES.padding,
  },
  label: {
    ...createFontStyle('medium', SIZES.body4),
    color: COLORS.textPrimary,
    marginBottom: SIZES.base,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.padding,
  },
  passwordInput: {
    flex: 1,
    padding: SIZES.padding / 2,
    color: COLORS.textPrimary,
    ...createFontStyle('regular', SIZES.body4),
  },
  showButton: {
    marginRight: 8,
  },
  passwordRequirements: {
    ...createFontStyle('regular', SIZES.body5),
    color: COLORS.textSecondary,
    marginBottom: SIZES.padding,
  },
  saveButton: {
    marginTop: SIZES.padding,
  },
}); 