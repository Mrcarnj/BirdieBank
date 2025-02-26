import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';

import { COLORS, SIZES, SHADOWS } from '../../../constants/theme';
import { RootState } from '../../../store';
import { updatePlayer } from '../../../store/slices/playerSlice';
import { createFontStyle } from '../../../utils/styleUtils';
import Button from '../../../components/Button';

export default function EditPlayerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const players = useSelector((state: RootState) => state.player.players);
  
  const [name, setName] = useState('');
  const [handicapIndex, setHandicapIndex] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{name?: string, handicapIndex?: string}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (players.length > 0 && id) {
      const player = players.find(p => p.id === id);
      if (player) {
        setName(player.name || '');
        setHandicapIndex(player.handicapIndex !== null && player.handicapIndex !== undefined 
          ? player.handicapIndex.toString() 
          : '');
      }
    }
    setLoading(false);
  }, [id, players]);

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
    
    setIsSubmitting(true);
    
    try {
      const playerData = {
        id: id as string,
        name: name.trim(),
        handicapIndex: handicapIndex ? parseFloat(handicapIndex) : undefined,
      };
      
      await dispatch(updatePlayer(playerData) as any);
      Alert.alert('Success', 'Player updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update player. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading player data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit Player</Text>
      </View>
      
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Player Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter player name"
            placeholderTextColor={COLORS.textSecondary}
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
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="numeric"
          />
          {errors.handicapIndex ? <Text style={styles.errorText}>{errors.handicapIndex}</Text> : null}
        </View>
        
        <View style={styles.actionsContainer}>
          <Button 
            title={isSubmitting ? "Updating Player..." : "Update Player"}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...createFontStyle('medium', 16),
    color: COLORS.secondary,
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