import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { signUp, clearError } from '../../store/slices/authSlice';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import Button from '../../components/Button';
import { router } from 'expo-router';
import { AppDispatch, RootState } from '../../store';
import { StatusBar } from 'expo-status-bar';
import { createFontStyle } from '../../utils/styleUtils';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Clear any previous errors
    dispatch(clearError());
  }, []);

  useEffect(() => {
    // Redirect to home if user is already logged in
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  useEffect(() => {
    // Show error alert if there's an error
    if (error) {
      Alert.alert('Registration Error', error);
      dispatch(clearError());
    }
  }, [error]);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long');
      return;
    }

    dispatch(signUp({ email, password }));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
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
          <Text style={styles.title}>BirdieBank</Text>
          <Text style={styles.subtitle}>Join the golf community</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Create Account</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <Button
            title="Register"
            onPress={handleRegister}
            loading={isLoading}
            style={styles.button}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By registering, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: SIZES.base,
  },
  title: {
    ...createFontStyle(FONTS.h1),
    color: COLORS.primary,
    marginBottom: SIZES.base / 2,
  },
  subtitle: {
    ...createFontStyle(FONTS.body3),
    color: COLORS.textSecondary,
  },
  formContainer: {
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    ...SHADOWS.medium,
  },
  formTitle: {
    ...createFontStyle(FONTS.h2),
    color: COLORS.textPrimary,
    marginBottom: SIZES.padding,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: SIZES.padding,
  },
  label: {
    ...createFontStyle(FONTS.body4),
    color: COLORS.textPrimary,
    marginBottom: SIZES.base / 2,
  },
  input: {
    backgroundColor: COLORS.secondaryLight,
    borderRadius: SIZES.radius / 2,
    padding: SIZES.base * 1.5,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...createFontStyle(FONTS.body3),
  },
  button: {
    marginTop: SIZES.base,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SIZES.padding * 2,
  },
  loginText: {
    ...createFontStyle(FONTS.body4),
    color: COLORS.textSecondary,
  },
  loginLink: {
    ...createFontStyle(FONTS.body4),
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: SIZES.base / 2,
  },
  termsContainer: {
    marginTop: SIZES.padding,
    alignItems: 'center',
  },
  termsText: {
    ...createFontStyle(FONTS.body5),
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
}); 