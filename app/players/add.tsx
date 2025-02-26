import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';

import { COLORS } from '../../constants/theme';
import { RootState } from '../../store';
import { createPlayer } from '../../store/slices/playerSlice';
import { createFontStyle } from '../../utils/styleUtils';
import Button from '../../components/Button';

export default function AddPlayerScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [name, setName] = useState('');
  const [handicapIndex, setHandicapIndex] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{name?: string, handicapIndex?: string}>({});

  const validateForm = () => {
    const newErrors: {name?: string, handicapIndex?: string} = {};
    
    if (!name.trim()) {
      newErrors.name = 'Player name is required';
    }
    
    if (handicapIndex && isNaN(Number(handicapIndex))) {
      newErrors.handicapIndex = 'Handicap must be a valid number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add a player');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const playerData = {
        name: name.trim(),
        handicapIndex: handicapIndex ? parseFloat(handicapIndex) : null,
        userId: user.id,
      };
      
      await dispatch(createPlayer(playerData) as any);
      Alert.alert('Success', 'Player added successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add player. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add New Player</Text>
      </View>
      
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Player Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter player name"
            placeholderTextColor={COLORS.secondary}
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Handicap Index</Text>
          <TextInput
            style={styles.input}
            value={handicapIndex}
            onChangeText={setHandicapIndex}
            placeholder="Enter handicap index (optional)"
            placeholderTextColor={COLORS.secondary}
            keyboardType="numeric"
          />
          {errors.handicapIndex ? <Text style={styles.errorText}>{errors.handicapIndex}</Text> : null}
        </View>
        
        <View style={styles.actionsContainer}>
          <Button 
            title={isSubmitting ? "Adding Player..." : "Add Player"}
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={styles.actionButton}
          />
          <Button 
            title="Cancel" 
            onPress={() => router.back()} 
            style={[styles.actionButton, styles.secondaryButton]}
            textStyle={styles.secondaryButtonText}
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
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary,
  },
  title: {
    ...createFontStyle('bold', 24),
    color: COLORS.secondary,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    ...createFontStyle('medium', 16),
    color: COLORS.secondary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 8,
    padding: 12,
    ...createFontStyle('regular', 16),
    color: COLORS.secondary,
  },
  errorText: {
    ...createFontStyle('regular', 14),
    color: COLORS.error,
    marginTop: 4,
  },
  actionsContainer: {
    marginTop: 20,
  },
  actionButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
  },
}); 