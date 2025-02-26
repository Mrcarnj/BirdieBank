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
import { signIn, clearError } from '../../store/slices/authSlice';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import Button from '../../components/Button';
import { router } from 'expo-router';
import { AppDispatch, RootState } from '../../store';
import { StatusBar } from 'expo-status-bar';
import { createFontStyle } from '../../utils/styleUtils';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      Alert.alert('Login Error', error);
      dispatch(clearError());
    }
  }, [error]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please fill in all fields');
      return;
    }

    dispatch(signIn({ email, password }));
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
          <Text style={styles.subtitle}>Track your golf game like a pro</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Login</Text>

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

          <Button
            title="Login"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.button}
          />

          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={() => {
              // Handle forgot password
            }}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
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
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: SIZES.padding,
  },
  forgotPasswordText: {
    ...createFontStyle(FONTS.body4),
    color: COLORS.primary,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SIZES.padding * 2,
  },
  registerText: {
    ...createFontStyle(FONTS.body4),
    color: COLORS.textSecondary,
  },
  registerLink: {
    ...createFontStyle(FONTS.body4),
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: SIZES.base / 2,
  },
}); 