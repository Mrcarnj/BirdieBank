import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

export default function TabLayout() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentRound } = useSelector((state: RootState) => state.round);

  if (!user) {
    return null; // Don't render tabs if user is not authenticated
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.secondary,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.secondary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
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
              <FontAwesome5 name="plus-circle" size={size} color={color} />
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