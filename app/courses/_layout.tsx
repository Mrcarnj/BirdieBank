import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../components/ThemeProvider';

export default function CoursesLayout() {
  const { colors } = useTheme();

  return (
    <Stack 
      initialRouteName="index"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.textLight,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitle: 'Home',
      }}
    />
  );
} 