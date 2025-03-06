import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from '../store';
import { supabase } from '../lib/supabase';
import { getSession } from '../store/slices/authSlice';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../components/ThemeProvider';
import 'react-native-url-polyfill/auto';

type CourseRouteParams = {
  id: string;
  source:'home';
}

// Inner layout component that has access to theme
function AppLayout() {
  const { colors, isDarkMode } = useTheme();

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} backgroundColor={colors.primary} />
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.textLight,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen 
            name="(tabs)" 
            options={{ headerShown: false }} 
          />
      </Stack>
    </>
  );
}

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
      <ThemeProvider>
        <AppLayout />
      </ThemeProvider>
    </Provider>
  );
}
