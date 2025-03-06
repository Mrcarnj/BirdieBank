import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { FONTS, SIZES } from '../../constants/theme';
import { RootState, AppDispatch } from '../../store';
import { createFriend, fetchPlayers } from '../../store/slices/playerSlice';
import { createFontStyle } from '../../utils/styleUtils';
import { useTheme } from '../ThemeProvider';
import Button from '../Button';

interface Player {
  id: string;
  name: string;
  handicapIndex?: number;
  profileImageUrl?: string;
  isGuest?: boolean;
  userId?: string;
  email?: string;
}

interface AddPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  activeTab: 'friends' | 'new';
  onTabChange: (tab: 'friends' | 'new') => void;
  onSelectFriend: (player: Player) => void;
  onCreatePlayer: (player: Player) => void;
  firstName: string;
  lastName: string;
  handicap: string;
  email: string;
  isPlusHandicap: boolean;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  setHandicap: (value: string) => void;
  setEmail: (value: string) => void;
  setIsPlusHandicap: (value: boolean) => void;
}

const AddPlayerModal: React.FC<AddPlayerModalProps> = ({
  visible,
  onClose,
  activeTab,
  onTabChange,
  onSelectFriend,
  onCreatePlayer,
  firstName,
  lastName,
  handicap,
  email,
  isPlusHandicap,
  setFirstName,
  setLastName,
  setHandicap,
  setEmail,
  setIsPlusHandicap,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { colors } = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);
  const { players, selectedPlayers } = useSelector((state: RootState) => state.player);

  // Debug useEffect to log players when modal becomes visible
  useEffect(() => {
    if (visible) {
      console.log('Modal visible, players:', players);
      console.log('Current user:', user);
      console.log('Selected players:', selectedPlayers);
      
      // Log each player individually for better debugging
      players.forEach((player, index) => {
        console.log(`Player ${index}: ${player.name}, ID: ${player.id}, isGuest: ${player.isGuest}`);
      });
      
      // If user exists, re-fetch players to ensure we have the latest data
      if (user?.id) {
        console.log('Fetching players for user ID:', user.id);
        dispatch(fetchPlayers(user.id));
      }
    }
  }, [visible, user]);

  const handleSelectFriend = (player: Player) => {
    // Check if the player is already selected
    if (selectedPlayers.some(p => p.id === player.id)) {
      Alert.alert('Already Added', 'This player is already added to the round.');
      return;
    }
    
    onSelectFriend(player);
  };

  const handleCreatePlayer = () => {
    // Validate required fields
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'First name and last name are required');
      return;
    }
    
    // Parse handicap
    let handicapValue: number | undefined = undefined;
    if (handicap.trim()) {
      handicapValue = parseFloat(handicap);
      if (isNaN(handicapValue)) {
        Alert.alert('Error', 'Handicap must be a valid number');
        return;
      }
      
      // Apply plus handicap (negative value)
      if (isPlusHandicap) {
        handicapValue = -Math.abs(handicapValue);
      }
    }
    
    // Make sure we have a user ID
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to add a player');
      return;
    }
    
    // Create the friend in the database
    dispatch(createFriend({
      userId: user.id,
      firstName: firstName,
      lastName: lastName,
      handicapIndex: handicapValue,
      email: email.trim() || undefined
    }))
      .unwrap()
      .then(newPlayer => {
        onCreatePlayer(newPlayer);
      })
      .catch(error => {
        console.error('Failed to create player:', error);
        Alert.alert('Error', 'Failed to create player. Please try again.');
      });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <View style={[styles.modalContainer, { 
            backgroundColor: colors.background,
            minHeight: 400,
            maxHeight: '80%'
          }]}>
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: SIZES.base
            }}>
              <Text style={[styles.modalTitle, { 
                color: colors.textPrimary,
                fontSize: 18,
              }]}>
                {activeTab === 'friends' ? 'Add Players' : 'Add New Friend'}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={{ padding: 4 }}
              >
                <FontAwesome5 name="times" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {/* Friends list tab */}
            {activeTab === 'friends' && (
              <View style={styles.friendsListContainer}>
                {players.filter(player => player.id !== user?.id).length === 0 ? (
                  <View style={styles.emptyFriendsContainer}>
                    <FontAwesome5 name="user-friends" size={32} color={colors.textSecondary} style={{ marginBottom: SIZES.padding }} />
                    <Text style={[styles.emptyFriendsText, { color: colors.textSecondary, textAlign: 'center' }]}>
                      No Friends Added Yet
                    </Text>
                    <Button
                      title="Add New Friend"
                      onPress={() => onTabChange('new')}
                      style={{ marginTop: SIZES.padding }}
                    />
                  </View>
                ) : (
                  <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.padding }}>
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          borderWidth: 1,
                          borderRadius: SIZES.radius,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: SIZES.padding * 0.5,
                          backgroundColor: colors.primary + '10',
                          borderColor: colors.primary,
                          marginRight: 8,
                        }}
                        onPress={() => onTabChange('new')}
                      >
                        <FontAwesome5 name="plus" size={14} color={colors.primary} style={{ marginRight: 6 }} />
                        <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>Add New Friend</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={{
                          width: 40,
                          height: 40,
                          borderWidth: 1,
                          borderRadius: SIZES.radius,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: colors.secondaryLight,
                          borderColor: colors.border,
                        }}
                        onPress={() => {
                          if (user?.id) {
                            dispatch(fetchPlayers(user.id));
                          }
                        }}
                      >
                        <FontAwesome5 name="sync" size={14} color={colors.textPrimary} />
                      </TouchableOpacity>
                    </View>
                    
                    <ScrollView 
                      style={[styles.friendsList, { maxHeight: 300 }]}
                      showsVerticalScrollIndicator={true}
                    >
                      {players
                        .map(player => {
                          console.log('Rendering player in list:', player);
                          
                          // Skip the current user
                          if (user && player.id === user.id) {
                            console.log('Skipping current user:', player.id);
                            return null;
                          }
                          
                          const isAlreadySelected = selectedPlayers.some(p => p.id === player.id);
                          console.log(`Player ${player.name} isAlreadySelected:`, isAlreadySelected);
                          
                          // Debug: Log if this is Zach
                          if (player.name.includes('Zach')) {
                            console.log('Found Zach in the players array:', player);
                          }
                          
                          return (
                            <TouchableOpacity
                              key={player.id}
                              style={[
                                styles.friendItem, 
                                { 
                                  borderBottomColor: colors.border,
                                  backgroundColor: isAlreadySelected ? colors.primary + '10' : 'transparent',
                                  paddingVertical: 12
                                }
                              ]}
                              onPress={() => {
                                if (!isAlreadySelected) {
                                  handleSelectFriend(player);
                                } else {
                                  Alert.alert('Already Added', 'This player is already added to the round.');
                                }
                              }}
                            >
                              <View style={styles.friendInfo}>
                                <Text style={[styles.friendName, { color: colors.textPrimary }]}>
                                  {player.name}
                                </Text>
                                {player.handicapIndex !== undefined && (
                                  <Text style={[styles.friendHandicap, { color: colors.textSecondary }]}>
                                    HCP: {player.handicapIndex}
                                  </Text>
                                )}
                              </View>
                              {isAlreadySelected ? (
                                <FontAwesome5 name="check" size={16} color={colors.primary} />
                              ) : (
                                <FontAwesome5 name="plus" size={16} color={colors.primary} />
                              )}
                            </TouchableOpacity>
                          );
                        })
                        // Add a debug log after filtering
                        .filter(Boolean) // Filter out null values (the current user)
                        .map((component, index) => {
                          console.log(`Rendering component ${index}`);
                          return component;
                        })
                      }
                    </ScrollView>
                  </>
                )}
              </View>
            )}

            {/* New player form tab */}
            {activeTab === 'new' && (
              <View style={styles.newPlayerFormContainer}>
                {/* Back button */}
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: SIZES.padding
                  }}
                  onPress={() => onTabChange('friends')}
                >
                  <FontAwesome5 name="arrow-left" size={14} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={{ color: colors.primary, fontWeight: '500' }}>Back to Friends</Text>
                </TouchableOpacity>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textPrimary }]}>First Name *</Text>
                  <TextInput
                    style={[styles.formInput, { 
                      color: colors.textPrimary,
                      borderColor: colors.border,
                      backgroundColor: colors.background
                    }]}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Enter first name"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Last Name *</Text>
                  <TextInput
                    style={[styles.formInput, { 
                      color: colors.textPrimary,
                      borderColor: colors.border,
                      backgroundColor: colors.background
                    }]}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Enter last name"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Handicap</Text>
                  <View style={styles.handicapInputContainer}>
                    <TouchableOpacity
                      style={[
                        styles.plusToggle,
                        { 
                          backgroundColor: isPlusHandicap ? colors.primary : colors.background,
                          borderColor: colors.border
                        }
                      ]}
                      onPress={() => setIsPlusHandicap(!isPlusHandicap)}
                    >
                      <Text style={[
                        styles.plusToggleText, 
                        { color: isPlusHandicap ? colors.textLight : colors.textPrimary }
                      ]}>+</Text>
                    </TouchableOpacity>
                    
                    <TextInput
                      style={[styles.handicapInput, { 
                        color: colors.textPrimary,
                        borderColor: colors.border,
                        backgroundColor: colors.background
                      }]}
                      value={handicap}
                      onChangeText={setHandicap}
                      placeholder="Handicap"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Email (Optional)</Text>
                  <TextInput
                    style={[styles.formInput, { 
                      color: colors.textPrimary,
                      borderColor: colors.border,
                      backgroundColor: colors.background
                    }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter email"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                
                <View style={styles.modalButtons}>
                  <Button
                    title="Add Friend"
                    onPress={handleCreatePlayer}
                    style={{ marginBottom: SIZES.base }}
                  />
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={onClose}
                  />
                </View>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  modalContainer: {
    width: '90%',
    minHeight: 400,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
  },
  modalTitle: {
    ...createFontStyle(FONTS.h4),
    marginBottom: SIZES.base,
    textAlign: 'center',
  },
  friendsListContainer: {
    minHeight: 300,
    flex: 1,
  },
  emptyFriendsContainer: {
    padding: SIZES.padding * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyFriendsText: {
    ...createFontStyle(FONTS.body3),
    fontWeight: '500',
    marginBottom: SIZES.padding,
    textAlign: 'center',
  },
  friendsList: {
    flex: 1,
    maxHeight: 300,
  },
  friendItem: {
    padding: SIZES.padding * 0.8,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    ...createFontStyle(FONTS.body4),
    fontWeight: '500',
    fontSize: 14,
  },
  friendHandicap: {
    ...createFontStyle(FONTS.body5),
    marginTop: 2,
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 12,
  },
  newPlayerFormContainer: {
    marginBottom: SIZES.padding,
  },
  formGroup: {
    marginBottom: SIZES.base * 1.5,
  },
  formLabel: {
    ...createFontStyle(FONTS.body5),
    marginBottom: SIZES.base / 2,
  },
  formInput: {
    height: 36,
    borderWidth: 1,
    borderRadius: SIZES.radius / 2,
    paddingHorizontal: SIZES.padding,
    fontSize: 14,
  },
  handicapInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plusToggle: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: SIZES.radius / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.base,
  },
  plusToggleText: {
    ...createFontStyle(FONTS.body4),
    fontWeight: '600',
  },
  handicapInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderRadius: SIZES.radius / 2,
    paddingHorizontal: SIZES.padding,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginTop: SIZES.padding,
  },
});

export default AddPlayerModal;
