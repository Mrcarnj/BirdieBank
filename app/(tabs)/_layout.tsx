import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useTheme } from '../../components/ThemeProvider';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function TabLayout() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentRound } = useSelector((state: RootState) => state.round);
  const { colors, shadows, isDarkMode } = useTheme();

  if (!user) {
    return null; // Don't render tabs if user is not authenticated
  }
  
  const handlePlayPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/new-round');
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none', // Hide the default tab bar since we're using a custom one
        },
        // Disable animations for smoother transitions
        animation: 'none',
      }}
      tabBar={(props) => (
        <View style={[styles.tabBarContainer, { backgroundColor: colors.card }]}>
          <View style={styles.tabBar}>
            {/* Home Tab */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.7}
            >
              <FontAwesome5 
                name="home" 
                size={22} 
                color={props.state.index === 0 ? colors.primary : colors.textSecondary} 
              />
              <Text 
                style={[
                  styles.tabLabel, 
                  { 
                    color: props.state.index === 0 ? colors.primary : colors.textSecondary,
                    opacity: props.state.index === 0 ? 1 : 0.8
                  }
                ]}
              >
                Home
              </Text>
            </TouchableOpacity>
            
            {/* Courses Tab */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => router.push('/courses')}
              activeOpacity={0.7}
            >
              <FontAwesome5 
                name="flag" 
                size={22} 
                color={colors.textSecondary} 
              />
              <Text style={[styles.tabLabel, { color: colors.textSecondary }]}>
                Courses
              </Text>
            </TouchableOpacity>
            
            {/* Center Play Button */}
            <View style={styles.playButtonContainer}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={handlePlayPress}
                activeOpacity={0.9}
              >
                <View
                  style={[
                    styles.playButtonGradient,
                    { backgroundColor: isDarkMode ? '#0A5F38' : '#2E7D32' }
                  ]}
                >
                  <FontAwesome5 name="golf-ball" size={24} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <Text style={[styles.playButtonLabel, { color: colors.textPrimary }]}>
                Play
              </Text>
            </View>
            
            {/* Profile Tab */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.7}
            >
              <FontAwesome5 
                name="user" 
                size={22} 
                color={props.state.index === 2 ? colors.primary : colors.textSecondary} 
              />
              <Text 
                style={[
                  styles.tabLabel, 
                  { 
                    color: props.state.index === 2 ? colors.primary : colors.textSecondary,
                    opacity: props.state.index === 2 ? 1 : 0.8
                  }
                ]}
              >
                Profile
              </Text>
            </TouchableOpacity>
            
            {/* History Tab */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => router.push('/history')}
              activeOpacity={0.7}
            >
              <FontAwesome5 
                name="history" 
                size={22} 
                color={colors.textSecondary} 
              />
              <Text style={[styles.tabLabel, { color: colors.textSecondary }]}>
                History
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="new-round"
        options={{
          title: 'New Round',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 90 : 70,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 100, // Ensure it's above other content
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    width: 60,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  playButtonContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 80,
    width: 80,
    bottom: 15,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  playButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});