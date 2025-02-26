import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
  TextInput,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

import { SIZES, FONTS } from '../../constants/theme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { signOut, getSession, clearError } from '../../store/slices/authSlice';
import { toggleDarkMode } from '../../store/slices/themeSlice';
import { AppDispatch, RootState } from '../../store';
import { createFontStyle } from '../../utils/styleUtils';
import { useTheme } from '../../components/ThemeProvider';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const { isDarkMode, colors } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [distanceUnit, setDistanceUnit] = useState('yards'); // 'yards' or 'meters'
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Sign Out", 
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            dispatch(signOut());
          }
        }
      ]
    );
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to grant permission to access your photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setUploadingImage(true);
      try {
        // In a real app, you would upload the image to a server here
        // For now, we'll just simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Then update the profile with the new image URL
        // Note: updateProfile is not available in authSlice
        // This would need to be implemented or replaced with appropriate functionality
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        Alert.alert("Error", "Failed to update profile image");
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const toggleSwitch = (setting: string) => {
    switch (setting) {
      case 'notifications':
        setNotificationsEnabled(prev => !prev);
        break;
      case 'location':
        setLocationEnabled(prev => !prev);
        break;
      case 'darkMode':
        dispatch(toggleDarkMode());
        break;
      default:
        break;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleDistanceUnit = () => {
    setDistanceUnit(prev => prev === 'yards' ? 'meters' : 'yards');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {uploadingImage ? (
              <View style={[styles.avatar, { backgroundColor: colors.primaryDark, borderColor: colors.secondary }]}>
                <ActivityIndicator size="small" color={colors.textLight} />
              </View>
            ) : (
              <>
                {user?.profileImageUrl ? (
                  <Image source={{ uri: user.profileImageUrl }} style={[styles.avatar, { borderColor: colors.secondary }]} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: colors.primaryDark, borderColor: colors.secondary }]}>
                    <Text style={[styles.avatarText, { color: colors.textLight }]}>{user?.email?.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <TouchableOpacity style={[styles.editAvatarButton, { backgroundColor: colors.secondary, borderColor: colors.secondary }]} onPress={handlePickImage}>
                  <Ionicons name="camera" size={16} color={colors.textLight} />
                </TouchableOpacity>
              </>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: colors.textLight }]}>{user?.name || 'Golfer'}</Text>
            <Text style={[styles.userEmail, { color: colors.textLight + 'DD' }]}>{user?.email}</Text>
            {user?.handicapIndex !== undefined && (
              <View style={[styles.handicapBadge, { backgroundColor: colors.textLight + '30' }]}>
                <Text style={[styles.handicapText, { color: colors.textLight }]}>
                  Handicap: {user.handicapIndex < 0 ? '+' : ''}{Math.abs(user.handicapIndex).toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Account</Text>
        <Card style={styles.card}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/profile/edit/edit' as any)}
          >
            <Ionicons name="person-outline" size={22} color={colors.primary} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.textPrimary }]}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/profile/handicap/handicap' as any)}
          >
            <Ionicons name="golf-outline" size={22} color={colors.primary} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.textPrimary }]}>Handicap Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/profile/password/password' as any)}
          >
            <Ionicons name="lock-closed-outline" size={22} color={colors.primary} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.textPrimary }]}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Preferences</Text>
        <Card style={styles.card}>
          <View style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={22} color={colors.primary} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.textPrimary }]}>Notifications</Text>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={notificationsEnabled ? colors.primary : colors.textSecondary}
              ios_backgroundColor={colors.border}
              onValueChange={() => toggleSwitch('notifications')}
              value={notificationsEnabled}
            />
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.menuItem}>
            <Ionicons name="location-outline" size={22} color={colors.primary} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.textPrimary }]}>Location Services</Text>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={locationEnabled ? colors.primary : colors.textSecondary}
              ios_backgroundColor={colors.border}
              onValueChange={() => toggleSwitch('location')}
              value={locationEnabled}
            />
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.menuItem}>
            <Ionicons name="moon-outline" size={22} color={colors.primary} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.textPrimary }]}>Dark Mode</Text>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={isDarkMode ? colors.primary : colors.textSecondary}
              ios_backgroundColor={colors.border}
              onValueChange={() => toggleSwitch('darkMode')}
              value={isDarkMode}
            />
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.menuItem}>
            <Ionicons name="resize-outline" size={22} color={colors.primary} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.textPrimary }]}>Distance Unit</Text>
            <TouchableOpacity 
              style={[styles.unitToggle, { backgroundColor: colors.border }]}
              onPress={toggleDistanceUnit}
            >
              <Text style={[
                styles.unitText, 
                { color: colors.textLight },
                distanceUnit === 'yards' ? { color: colors.primary, fontWeight: 'bold' } : {}
              ]}>
                Yards
              </Text>
              <Text style={[styles.unitSeparator, { color: colors.border }]}>|</Text>
              <Text style={[
                styles.unitText, 
                { color: colors.textLight },
                distanceUnit === 'meters' ? { color: colors.primary, fontWeight: 'bold' } : {}
              ]}>
                Meters
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>App</Text>
        <Card style={styles.card}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => Alert.alert('About', 'BirdieBank v1.0.0\n\nA golf score tracking app.')}
          >
            <Ionicons name="information-circle-outline" size={22} color={colors.primary} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.textPrimary }]}>About</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => Alert.alert('Help', 'Need help? Contact support@birdiebank.com')}
          >
            <Ionicons name="help-circle-outline" size={22} color={colors.primary} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.textPrimary }]}>Help</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.error} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.error }]}>Sign Out</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </Card>
        
        <Text style={[styles.versionText, { color: colors.textSecondary }]}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SIZES.margin,
    fontSize: FONTS.body4.fontSize,
  },
  header: {
    paddingTop: SIZES.padding * 2,
    paddingBottom: SIZES.padding,
    paddingHorizontal: SIZES.padding / 2,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SIZES.margin / 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  avatarText: {
    fontSize: FONTS.h1.fontSize,
    fontWeight: 'bold',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FONTS.h2.fontSize,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: FONTS.body4.fontSize,
    marginBottom: SIZES.base,
  },
  handicapBadge: {
    paddingHorizontal: SIZES.base,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  handicapText: {
    fontSize: FONTS.body4.fontSize,
    fontWeight: 'bold',
  },
  content: {
    padding: SIZES.padding / 2,
  },
  sectionTitle: {
    fontSize: FONTS.h4.fontSize,
    fontWeight: 'bold',
    marginTop: SIZES.margin,
    marginBottom: SIZES.base,
    paddingHorizontal: SIZES.base,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding / 2,
  },
  menuIcon: {
    marginRight: SIZES.padding / 2,
  },
  menuText: {
    flex: 1,
    fontSize: FONTS.body4.fontSize,
  },
  divider: {
    height: 1,
    marginLeft: SIZES.padding + SIZES.padding / 2,
  },
  unitToggle: {
    flexDirection: 'row',
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: SIZES.base,
  },
  unitText: {
    fontSize: FONTS.body5.fontSize,
    paddingHorizontal: 8,
  },
  unitSeparator: {
    fontSize: FONTS.body5.fontSize,
  },
  signOutButton: {
    marginTop: SIZES.margin,
  },
  versionText: {
    textAlign: 'center',
    marginTop: SIZES.margin,
    marginBottom: SIZES.margin,
    fontSize: FONTS.body5.fontSize,
  },
}); 