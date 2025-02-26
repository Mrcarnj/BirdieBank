import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from '../store';
import { supabase } from '../lib/supabase';
import { getSession } from '../store/slices/authSlice';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../constants/theme';
import 'react-native-url-polyfill/auto';

export default function RootLayout() {
  useEffect(() => {
    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          store.dispatch(getSession());
        } else if (event === 'SIGNED_OUT') {
          store.dispatch(getSession());
        }
      }
    );

    // Check for existing session on app load
    store.dispatch(getSession());

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Provider store={store}>
      <StatusBar style="light" backgroundColor={COLORS.primary} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.secondary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'BirdieBank' }} />
        <Stack.Screen name="auth/login" options={{ title: 'Login', headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ title: 'Register', headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </Provider>
  );
}
