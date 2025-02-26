import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';

import { COLORS } from '../../constants/theme';
import { AppDispatch } from '../../store';
import { createFontStyle } from '../../utils/styleUtils';
import Button from '../../components/Button';

interface CourseTee {
  name: string;
  color: string;
}

export default function AddCourseScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const [courseName, setCourseName] = useState('');
  const [courseAddress, setCourseAddress] = useState('');
  const [tees, setTees] = useState<CourseTee[]>([]);
  const [newTeeName, setNewTeeName] = useState('');
  const [newTeeColor, setNewTeeColor] = useState('#000000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const commonTeeColors = [
    { name: 'Black', color: '#000000' },
    { name: 'Blue', color: '#0000FF' },
    { name: 'White', color: '#FFFFFF' },
    { name: 'Red', color: '#FF0000' },
    { name: 'Gold', color: '#FFD700' },
    { name: 'Green', color: '#008000' },
  ];

  const addTee = () => {
    if (!newTeeName.trim()) {
      Alert.alert('Error', 'Please enter a tee name');
      return;
    }
    
    setTees([...tees, { name: newTeeName, color: newTeeColor }]);
    setNewTeeName('');
    setNewTeeColor('#000000');
  };

  const removeTee = (index: number) => {
    const updatedTees = [...tees];
    updatedTees.splice(index, 1);
    setTees(updatedTees);
  };

  const handleSubmit = async () => {
    if (!courseName.trim()) {
      Alert.alert('Error', 'Please enter a course name');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // In a real app, you would dispatch an action to add the course
      // For now, we'll just simulate a successful submission
      setTimeout(() => {
        setIsSubmitting(false);
        Alert.alert(
          'Success',
          'Course added successfully!',
          [
            { 
              text: 'OK', 
              onPress: () => router.back() 
            }
          ]
        );
      }, 1000);
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert('Error', 'Failed to add course. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <Stack.Screen options={{ title: 'Add New Course' }} />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          <Text style={styles.label}>Course Name *</Text>
          <TextInput
            style={styles.input}
            value={courseName}
            onChangeText={setCourseName}
            placeholder="Enter course name"
            placeholderTextColor={COLORS.secondary}
          />
          
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            value={courseAddress}
            onChangeText={setCourseAddress}
            placeholder="Enter course address"
            placeholderTextColor={COLORS.secondary}
            multiline
          />
          
          <Text style={styles.sectionTitle}>Tees</Text>
          <Text style={styles.sectionSubtitle}>Add the tee options available at this course</Text>
          
          {tees.length > 0 ? (
            <View style={styles.teeList}>
              {tees.map((tee, index) => (
                <View key={index} style={styles.teeItem}>
                  <View style={[styles.teeColorIndicator, { backgroundColor: tee.color }]} />
                  <Text style={styles.teeName}>{tee.name}</Text>
                  <TouchableOpacity onPress={() => removeTee(index)}>
                    <Ionicons name="close-circle" size={24} color={COLORS.secondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyTees}>
              <Text style={styles.emptyTeesText}>No tees added yet</Text>
            </View>
          )}
          
          <View style={styles.addTeeContainer}>
            <Text style={styles.label}>Add New Tee</Text>
            <View style={styles.teeInputRow}>
              <TextInput
                style={[styles.input, styles.teeNameInput]}
                value={newTeeName}
                onChangeText={setNewTeeName}
                placeholder="Tee name"
                placeholderTextColor={COLORS.secondary}
              />
              
              <View style={styles.colorPickerContainer}>
                <View style={[styles.selectedColor, { backgroundColor: newTeeColor }]} />
                <View style={styles.colorOptions}>
                  {commonTeeColors.map((colorOption, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.colorOption,
                        { backgroundColor: colorOption.color },
                        newTeeColor === colorOption.color && styles.selectedColorOption
                      ]}
                      onPress={() => setNewTeeColor(colorOption.color)}
                    />
                  ))}
                </View>
              </View>
            </View>
            
            <Button
              title="Add Tee"
              onPress={addTee}
              style={styles.addTeeButton}
              type="secondary"
            />
          </View>
          
          <View style={styles.submitContainer}>
            <Button
              title={isSubmitting ? 'Adding Course...' : 'Add Course'}
              onPress={handleSubmit}
              disabled={isSubmitting || !courseName.trim()}
              loading={isSubmitting}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  label: {
    ...createFontStyle('medium', 14),
    color: COLORS.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: COLORS.secondary,
    ...createFontStyle('regular', 16),
  },
  sectionTitle: {
    ...createFontStyle('bold', 18),
    color: COLORS.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionSubtitle: {
    ...createFontStyle('regular', 14),
    color: COLORS.secondary,
    marginBottom: 16,
  },
  teeList: {
    marginBottom: 24,
  },
  teeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  teeColorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  teeName: {
    ...createFontStyle('medium', 16),
    color: COLORS.secondary,
    flex: 1,
  },
  emptyTees: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 8,
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  emptyTeesText: {
    ...createFontStyle('regular', 14),
    color: COLORS.secondary,
  },
  addTeeContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  teeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  teeNameInput: {
    flex: 1,
    marginRight: 8,
    marginBottom: 0,
  },
  colorPickerContainer: {
    width: 100,
  },
  selectedColor: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignSelf: 'center',
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  colorOption: {
    width: 24,
    height: 24,
    borderRadius: 12,
    margin: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  addTeeButton: {
    marginTop: 8,
  },
  submitContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
}); 