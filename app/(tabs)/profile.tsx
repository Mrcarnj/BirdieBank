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

import { COLORS, SIZES, FONTS } from '../../constants/theme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { signOut, getSession, clearError } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store';
import { createFontStyle } from '../../utils/styleUtils';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
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
        setDarkModeEnabled(prev => !prev);
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {uploadingImage ? (
              <View style={styles.avatar}>
                <ActivityIndicator size="small" color={COLORS.textLight} />
              </View>
            ) : (
              <>
                {user?.profileImageUrl ? (
                  <Image source={{ uri: user.profileImageUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.editAvatarButton} onPress={handlePickImage}>
                  <Ionicons name="camera" size={16} color={COLORS.textLight} />
                </TouchableOpacity>
              </>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name || 'Golfer'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            {user?.handicapIndex !== undefined && (
              <View style={styles.handicapBadge}>
                <Text style={styles.handicapText}>
                  Handicap: {user.handicapIndex.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Card style={styles.card}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/profile/edit' as any)}
          >
            <Ionicons name="person-outline" size={22} color={COLORS.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/profile/handicap' as any)}
          >
            <Ionicons name="golf-outline" size={22} color={COLORS.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Handicap Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/profile/password' as any)}
          >
            <Ionicons name="lock-closed-outline" size={22} color={COLORS.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        </Card>

        <Text style={styles.sectionTitle}>Preferences</Text>
        <Card style={styles.card}>
          <View style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Notifications</Text>
            <Switch
              trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
              thumbColor={notificationsEnabled ? COLORS.primary : COLORS.textSecondary}
              ios_backgroundColor={COLORS.border}
              onValueChange={() => toggleSwitch('notifications')}
              value={notificationsEnabled}
            />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.menuItem}>
            <Ionicons name="location-outline" size={22} color={COLORS.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Location Services</Text>
            <Switch
              trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
              thumbColor={locationEnabled ? COLORS.primary : COLORS.textSecondary}
              ios_backgroundColor={COLORS.border}
              onValueChange={() => toggleSwitch('location')}
              value={locationEnabled}
            />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.menuItem}>
            <Ionicons name="moon-outline" size={22} color={COLORS.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Dark Mode</Text>
            <Switch
              trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
              thumbColor={darkModeEnabled ? COLORS.primary : COLORS.textSecondary}
              ios_backgroundColor={COLORS.border}
              onValueChange={() => toggleSwitch('darkMode')}
              value={darkModeEnabled}
            />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.menuItem}>
            <Ionicons name="resize-outline" size={22} color={COLORS.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Distance Unit</Text>
            <TouchableOpacity 
              style={styles.unitToggle}
              onPress={toggleDistanceUnit}
            >
              <Text style={[
                styles.unitText, 
                distanceUnit === 'yards' ? styles.activeUnitText : {}
              ]}>
                Yards
              </Text>
              <Text style={styles.unitSeparator}>|</Text>
              <Text style={[
                styles.unitText, 
                distanceUnit === 'meters' ? styles.activeUnitText : {}
              ]}>
                Meters
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>App</Text>
        <Card style={styles.card}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/help' as any)}
          >
            <Ionicons name="help-circle-outline" size={22} color={COLORS.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/about' as any)}
          >
            <Ionicons name="information-circle-outline" size={22} color={COLORS.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>About</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/privacy' as any)}
          >
            <Ionicons name="shield-outline" size={22} color={COLORS.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        </Card>

        <Button 
          title="Sign Out" 
          onPress={handleSignOut} 
          style={styles.signOutButton}
          variant="secondary"
        />

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SIZES.margin,
    color: COLORS.textPrimary,
    fontSize: FONTS.body4.fontSize,
  },
  header: {
    backgroundColor: COLORS.primary,
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
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.secondary,
  },
  avatarText: {
    fontSize: FONTS.h1.fontSize,
    fontWeight: 'bold',
    color: COLORS.textLight,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.secondary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FONTS.h2.fontSize,
    fontWeight: 'bold',
    color: COLORS.textLight,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: FONTS.body4.fontSize,
    color: COLORS.textLight + 'DD',
    marginBottom: SIZES.base,
  },
  handicapBadge: {
    backgroundColor: COLORS.textLight + '30',
    paddingHorizontal: SIZES.base,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  handicapText: {
    fontSize: FONTS.body4.fontSize,
    color: COLORS.textLight,
    fontWeight: 'bold',
  },
  content: {
    padding: SIZES.padding / 2,
  },
  sectionTitle: {
    fontSize: FONTS.h4.fontSize,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
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
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: SIZES.padding + SIZES.padding / 2,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.border,
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: SIZES.base,
  },
  unitText: {
    fontSize: FONTS.body5.fontSize,
    color: COLORS.textLight,
    paddingHorizontal: 8,
  },
  activeUnitText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  unitSeparator: {
    color: COLORS.border,
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
    color: COLORS.textLight,
  },
}); 