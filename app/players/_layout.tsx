import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '../../constants/theme';

export default function PlayersLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.secondary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    />
  );
} 