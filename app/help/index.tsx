import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SIZES } from '../../constants/theme';
import { createFontStyle } from '../../utils/styleUtils';

const HelpScreen = () => {
  const router = useRouter();
  
  const faqs = [
    {
      question: 'How do I start a new round?',
      answer: 'Go to the "New Round" tab, select a course, add players, and tap "Start Round".'
    },
    {
      question: 'How is my handicap calculated?',
      answer: 'Your handicap index is calculated based on your 8 best scores from your last 20 rounds, following USGA guidelines.'
    },
    {
      question: 'Can I edit a completed round?',
      answer: 'Yes, you can edit a completed round by going to your history and selecting the round you want to modify.'
    },
    {
      question: 'How do I add a new course?',
      answer: 'Go to the "Courses" tab and tap the "+" button in the top right corner to add a new course.'
    },
    {
      question: 'Can I play with friends who don\'t use the app?',
      answer: 'Yes, you can add guest players when starting a new round.'
    }
  ];

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@birdiebank.com');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'Help & Support',
          headerTitleStyle: createFontStyle('semiBold', SIZES.body2),
          headerTintColor: COLORS.primary,
          headerStyle: { backgroundColor: COLORS.secondary },
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          {faqs.map((faq, index) => (
            <View key={index} style={styles.faqItem}>
              <Text style={styles.question}>{faq.question}</Text>
              <Text style={styles.answer}>{faq.answer}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Need More Help?</Text>
          
          <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
            <Ionicons name="mail-outline" size={24} color={COLORS.secondary} />
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.linkButton} 
            onPress={() => router.push('/about' as any)}
          >
            <Text style={styles.linkText}>About BirdieBank</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.linkButton} 
            onPress={() => router.push('/privacy' as any)}
          >
            <Text style={styles.linkText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    padding: SIZES.base * 2,
  },
  section: {
    marginBottom: SIZES.base * 3,
  },
  sectionTitle: {
    ...createFontStyle('semiBold', SIZES.body2),
    color: COLORS.primary,
    marginBottom: SIZES.base * 2,
  },
  faqItem: {
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radius,
    padding: SIZES.base * 2,
    marginBottom: SIZES.base * 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  question: {
    ...createFontStyle('semiBold', SIZES.body3),
    color: COLORS.primary,
    marginBottom: SIZES.base,
  },
  answer: {
    ...createFontStyle('regular', SIZES.body4),
    color: COLORS.textDark,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: SIZES.base * 1.5,
    marginBottom: SIZES.base * 2,
  },
  supportButtonText: {
    ...createFontStyle('semiBold', SIZES.body3),
    color: COLORS.secondary,
    marginLeft: SIZES.base,
  },
  linkButton: {
    padding: SIZES.base,
    marginBottom: SIZES.base,
  },
  linkText: {
    ...createFontStyle('medium', SIZES.body4),
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});

export default HelpScreen; 