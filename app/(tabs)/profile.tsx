import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing, FontSize } from '../../constants/Theme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { signOut, updateProfile } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store/store';

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
        dispatch(updateProfile({
          profileImageUrl: result.assets[0].uri
        }));
        
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
        <ActivityIndicator size="large" color={Colors.primary} />
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
                <ActivityIndicator size="small" color={Colors.white} />
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
                  <Ionicons name="camera" size={16} color={Colors.white} />
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
            onPress={() => router.push('/profile/edit')}
          >
            <Ionicons name="person-outline" size={22} color={Colors.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/profile/handicap')}
          >
            <Ionicons name="golf-outline" size={22} color={Colors.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Handicap Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/profile/password')}
          >
            <Ionicons name="lock-closed-outline" size={22} color={Colors.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
          </TouchableOpacity>
        </Card>

        <Text style={styles.sectionTitle}>Preferences</Text>
        <Card style={styles.card}>
          <View style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={22} color={Colors.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Notifications</Text>
            <Switch
              trackColor={{ false: Colors.lightGray, true: Colors.primary + '80' }}
              thumbColor={notificationsEnabled ? Colors.primary : Colors.gray}
              ios_backgroundColor={Colors.lightGray}
              onValueChange={() => toggleSwitch('notifications')}
              value={notificationsEnabled}
            />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.menuItem}>
            <Ionicons name="location-outline" size={22} color={Colors.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Location Services</Text>
            <Switch
              trackColor={{ false: Colors.lightGray, true: Colors.primary + '80' }}
              thumbColor={locationEnabled ? Colors.primary : Colors.gray}
              ios_backgroundColor={Colors.lightGray}
              onValueChange={() => toggleSwitch('location')}
              value={locationEnabled}
            />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.menuItem}>
            <Ionicons name="moon-outline" size={22} color={Colors.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Dark Mode</Text>
            <Switch
              trackColor={{ false: Colors.lightGray, true: Colors.primary + '80' }}
              thumbColor={darkModeEnabled ? Colors.primary : Colors.gray}
              ios_backgroundColor={Colors.lightGray}
              onValueChange={() => toggleSwitch('darkMode')}
              value={darkModeEnabled}
            />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.menuItem}>
            <Ionicons name="resize-outline" size={22} color={Colors.primary} style={styles.menuIcon} />
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
            onPress={() => router.push('/help')}
          >
            <Ionicons name="help-circle-outline" size={22} color={Colors.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/about')}
          >
            <Ionicons name="information-circle-outline" size={22} color={Colors.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>About</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/privacy')}
          >
            <Ionicons name="shield-outline" size={22} color={Colors.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
          </TouchableOpacity>
        </Card>

        <Button 
          title="Sign Out" 
          onPress={handleSignOut} 
          style={styles.signOutButton}
          type="secondary"
        />

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.medium,
    color: Colors.text,
    fontSize: FontSize.medium,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Spacing.large * 2,
    paddingBottom: Spacing.large,
    paddingHorizontal: Spacing.medium,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.medium,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  avatarText: {
    fontSize: FontSize.xlarge,
    fontWeight: 'bold',
    color: Colors.white,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.secondary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FontSize.large,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: FontSize.small,
    color: Colors.white + 'DD',
    marginBottom: Spacing.small,
  },
  handicapBadge: {
    backgroundColor: Colors.white + '30',
    paddingHorizontal: Spacing.small,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  handicapText: {
    fontSize: FontSize.small,
    color: Colors.white,
    fontWeight: 'bold',
  },
  content: {
    padding: Spacing.medium,
  },
  sectionTitle: {
    fontSize: FontSize.medium,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.medium,
    marginBottom: Spacing.small,
    paddingHorizontal: Spacing.small,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.medium,
  },
  menuIcon: {
    marginRight: Spacing.medium,
  },
  menuText: {
    flex: 1,
    fontSize: FontSize.medium,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.large + Spacing.medium,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.lightGray,
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: Spacing.small,
  },
  unitText: {
    fontSize: FontSize.small,
    color: Colors.textLight,
    paddingHorizontal: 8,
  },
  activeUnitText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  unitSeparator: {
    color: Colors.border,
    fontSize: FontSize.small,
  },
  signOutButton: {
    marginTop: Spacing.large,
  },
  versionText: {
    textAlign: 'center',
    marginTop: Spacing.large,
    marginBottom: Spacing.large,
    fontSize: FontSize.small,
    color: Colors.textLight,
  },
}); 