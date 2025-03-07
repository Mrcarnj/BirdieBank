import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useTheme } from '../../components/ThemeProvider';

export default function TabLayout() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentRound } = useSelector((state: RootState) => state.round);
  const { colors } = useTheme();

  if (!user) {
    return null; // Don't render tabs if user is not authenticated
  }

  return (
<Tabs
      screenOptions={{
        headerShown: true,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        // Disable animations for smoother transitions
        animation: 'none',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="new-round"
        options={{
          title: 'New Round',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="golf-ball" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}