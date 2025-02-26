import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

import { COLORS, SIZES } from '../../constants/theme';
import { createFontStyle } from '../../utils/styleUtils';

const PrivacyPolicyScreen = () => {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'Privacy Policy',
          headerTitleStyle: createFontStyle('semiBold', SIZES.body2),
          headerTintColor: COLORS.primary,
          headerStyle: { backgroundColor: COLORS.secondary },
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: June 1, 2023</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Introduction</Text>
          <Text style={styles.paragraph}>
            BirdieBank ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by BirdieBank.
          </Text>
          <Text style={styles.paragraph}>
            This Privacy Policy applies to our mobile application, and its associated services (collectively, our "Service"). By accessing or using our Service, you signify that you have read, understood, and agree to our collection, storage, use, and disclosure of your personal information as described in this Privacy Policy.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information We Collect</Text>
          <Text style={styles.paragraph}>
            We collect information from you when you register for an account, use our Service, or communicate with us. The types of information we may collect include:
          </Text>
          
          <Text style={styles.subTitle}>Personal Information</Text>
          <Text style={styles.paragraph}>
            - Name{'\n'}
            - Email address{'\n'}
            - Profile picture{'\n'}
            - Handicap index{'\n'}
            - Golf scores and statistics
          </Text>
          
          <Text style={styles.subTitle}>Usage Information</Text>
          <Text style={styles.paragraph}>
            - Device information (e.g., device type, operating system){'\n'}
            - Log data (e.g., access times, hardware and software information){'\n'}
            - Cookie and tracking technology data
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use the information we collect to:{'\n'}
            - Provide, maintain, and improve our Service{'\n'}
            - Process and complete transactions{'\n'}
            - Send you technical notices and support messages{'\n'}
            - Respond to your comments and questions{'\n'}
            - Develop new products and services{'\n'}
            - Monitor and analyze trends, usage, and activities{'\n'}
            - Personalize your experience
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sharing Your Information</Text>
          <Text style={styles.paragraph}>
            We may share your information with:{'\n'}
            - Service providers who perform services on our behalf{'\n'}
            - Other users when you choose to share your golf scores or statistics{'\n'}
            - Third parties in connection with a business transfer{'\n'}
            - Law enforcement or other third parties when required by law
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Rights and Choices</Text>
          <Text style={styles.paragraph}>
            You have certain rights regarding your personal information:{'\n'}
            - Access and update your information through your account settings{'\n'}
            - Opt-out of marketing communications{'\n'}
            - Request deletion of your account and personal information{'\n'}
            - Control app permissions such as location access
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Security</Text>
          <Text style={styles.paragraph}>
            We implement appropriate technical and organizational measures to protect the security of your personal information. However, no security system is impenetrable, and we cannot guarantee the security of our systems 100%.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Changes to This Policy</Text>
          <Text style={styles.paragraph}>
            We may modify this Privacy Policy from time to time. If we make material changes, we will notify you through the app or by other means.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have any questions about this Privacy Policy, please contact us at privacy@birdiebank.com.
          </Text>
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
  lastUpdated: {
    ...createFontStyle('italic', SIZES.body4),
    color: COLORS.textLight,
    marginBottom: SIZES.base * 2,
  },
  section: {
    marginBottom: SIZES.base * 3,
  },
  sectionTitle: {
    ...createFontStyle('semiBold', SIZES.body2),
    color: COLORS.primary,
    marginBottom: SIZES.base * 1.5,
  },
  subTitle: {
    ...createFontStyle('semiBold', SIZES.body3),
    color: COLORS.primary,
    marginTop: SIZES.base,
    marginBottom: SIZES.base,
  },
  paragraph: {
    ...createFontStyle('regular', SIZES.body4),
    color: COLORS.textDark,
    lineHeight: 22,
    marginBottom: SIZES.base,
  },
  copyright: {
    ...createFontStyle('regular', SIZES.body5),
    color: COLORS.textLight,
    textAlign: 'center',
    marginVertical: SIZES.base * 2,
  },
});

export default PrivacyPolicyScreen; 