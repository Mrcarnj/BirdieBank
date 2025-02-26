import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Linking, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SIZES } from '../../constants/theme';
import { createFontStyle } from '../../utils/styleUtils';

const APP_VERSION = '1.0.0';

const AboutScreen = () => {
  const handleOpenWebsite = () => {
    Linking.openURL('https://birdiebank.com');
  };

  const handleOpenTwitter = () => {
    Linking.openURL('https://twitter.com/birdiebank');
  };

  const handleOpenInstagram = () => {
    Linking.openURL('https://instagram.com/birdiebank');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'About',
          headerTitleStyle: createFontStyle('semiBold', SIZES.body2) as any,
          headerTintColor: COLORS.primary,
          headerStyle: { backgroundColor: COLORS.secondary },
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          {(() => {
            try {
              // Try to require the image, but don't crash if it's missing
              const logoImage = require('../../assets/images/react-logo.png');
              return (
                <Image 
                  source={logoImage} 
                  style={styles.logo}
                  resizeMode="contain"
                />
              );
            } catch (error) {
              // Fallback if image is missing
              return (
                <View style={[styles.logo, { backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: COLORS.secondary, fontSize: 24, fontWeight: 'bold' }}>BB</Text>
                </View>
              );
            }
          })()}
          <Text style={styles.appName}>BirdieBank</Text>
          <Text style={styles.tagline}>Your Personal Golf Companion</Text>
          <Text style={styles.version}>Version {APP_VERSION}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About BirdieBank</Text>
          <Text style={styles.description}>
            BirdieBank is a comprehensive golf scoring and handicap tracking app designed to enhance your golfing experience. 
            Track your scores, analyze your performance, and improve your game with detailed statistics and insights.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="golf-outline" size={24} color={COLORS.primary} style={styles.featureIcon} />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Score Tracking</Text>
              <Text style={styles.featureDescription}>Record scores for each hole with detailed statistics</Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="calculator-outline" size={24} color={COLORS.primary} style={styles.featureIcon} />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Handicap Calculation</Text>
              <Text style={styles.featureDescription}>Automatic handicap index calculation following USGA guidelines</Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="analytics-outline" size={24} color={COLORS.primary} style={styles.featureIcon} />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Performance Analytics</Text>
              <Text style={styles.featureDescription}>Detailed statistics and trends to improve your game</Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="people-outline" size={24} color={COLORS.primary} style={styles.featureIcon} />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Multiplayer Support</Text>
              <Text style={styles.featureDescription}>Track scores for your entire group in one place</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect With Us</Text>
          
          <View style={styles.socialLinks}>
            <TouchableOpacity style={styles.socialButton} onPress={handleOpenWebsite}>
              <Ionicons name="globe-outline" size={24} color={COLORS.secondary} />
              <Text style={styles.socialButtonText}>Website</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.socialButton} onPress={handleOpenTwitter}>
              <Ionicons name="logo-twitter" size={24} color={COLORS.secondary} />
              <Text style={styles.socialButtonText}>Twitter</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.socialButton} onPress={handleOpenInstagram}>
              <Ionicons name="logo-instagram" size={24} color={COLORS.secondary} />
              <Text style={styles.socialButtonText}>Instagram</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.copyright}>© 2023 BirdieBank. All rights reserved.</Text>
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
  logoContainer: {
    alignItems: 'center',
    marginVertical: SIZES.base * 3,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: SIZES.base,
  },
  appName: {
    ...createFontStyle('bold', SIZES.body1),
    color: COLORS.primary,
  },
  tagline: {
    ...createFontStyle('medium', SIZES.body3),
    color: COLORS.textDark,
    marginTop: SIZES.base / 2,
  },
  version: {
    ...createFontStyle('regular', SIZES.body4),
    color: COLORS.textLight,
    marginTop: SIZES.base,
  },
  section: {
    marginBottom: SIZES.base * 3,
  },
  sectionTitle: {
    ...createFontStyle('semiBold', SIZES.body2),
    color: COLORS.primary,
    marginBottom: SIZES.base * 2,
  },
  description: {
    ...createFontStyle('regular', SIZES.body4),
    color: COLORS.textDark,
    lineHeight: 22,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: SIZES.base * 2,
  },
  featureIcon: {
    marginRight: SIZES.base * 1.5,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    ...createFontStyle('semiBold', SIZES.body3),
    color: COLORS.primary,
    marginBottom: SIZES.base / 2,
  },
  featureDescription: {
    ...createFontStyle('regular', SIZES.body4),
    color: COLORS.textDark,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: SIZES.base * 1.5,
    flex: 1,
    marginHorizontal: SIZES.base / 2,
  },
  socialButtonText: {
    ...createFontStyle('medium', SIZES.body4),
    color: COLORS.secondary,
    marginTop: SIZES.base,
  },
  copyright: {
    ...createFontStyle('regular', SIZES.body5),
    color: COLORS.textLight,
    textAlign: 'center',
    marginVertical: SIZES.base * 2,
  },
});

export default AboutScreen; 