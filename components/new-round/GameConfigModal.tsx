import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
  Switch
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { FONTS, SIZES } from '../../constants/theme';
import { PlayerWithTee } from '../../store/slices/playerSlice';
import Button from '../Button';
import { createFontStyle } from '../../utils/styleUtils';
import { useTheme } from '../ThemeProvider';

interface GameConfigModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (config: GameConfig) => void;
  gameToConfig: GameInfo | null;
  players: PlayerWithTee[];
}

interface GameInfo {
  type: string;
  name: string;
  description: string;
  icon: string;
}

export interface GameConfig {
  type: string;
  stake: number;
  settings: Record<string, any>;
}

const GameConfigModal: React.FC<GameConfigModalProps> = ({ 
  visible, 
  onClose, 
  onSave, 
  gameToConfig, 
  players 
}) => {
  const { colors } = useTheme();
  
  const [gameStake, setGameStake] = useState('1');
  const [gameTeams, setGameTeams] = useState<{[playerId: string]: number}>({});
  const [gameSettings, setGameSettings] = useState<Record<string, any>>({});
  
  // Reset state when the modal opens with a new game
  useEffect(() => {
    if (gameToConfig) {
      setGameStake('1');
      
      // Initialize teams based on game type
      const initialTeams: {[playerId: string]: number} = {};
      players.forEach((player, index) => {
        if (gameToConfig.type === 'wolf' || gameToConfig.type === 'vegas') {
          // For team games, assign initial teams (can be changed in modal)
          initialTeams[player.id] = index % 2; // Alternating teams 0 and 1
        } else {
          // For individual games, each player is their own team
          initialTeams[player.id] = index;
        }
      });
      setGameTeams(initialTeams);
      
      // Initialize game-specific settings
      const initialSettings: Record<string, any> = {};
      if (gameToConfig.type === 'nassau') {
        initialSettings.frontNineStake = 1;
        initialSettings.backNineStake = 1;
        initialSettings.totalStake = 1;
        initialSettings.usePress = true;
        initialSettings.automaticPress = true;
        initialSettings.pressAmount = 1;
      } else if (gameToConfig.type === 'skins') {
        initialSettings.carryover = true;
      } else if (gameToConfig.type === 'stableford') {
        initialSettings.modifiedScoring = false; // false = traditional, true = modified
      }
      setGameSettings(initialSettings);
    }
  }, [gameToConfig, players]);
  
  const handleSave = () => {
    if (!gameToConfig) return;
    
    // Validate stake
    const stake = parseFloat(gameStake);
    if (isNaN(stake) || stake <= 0) {
      alert('Please enter a valid stake amount greater than 0.');
      return;
    }
    
    // Create game settings object
    const gameConfig: GameConfig = {
      type: gameToConfig.type,
      stake: stake,
      settings: {
        ...gameSettings,
        teams: gameTeams
      }
    };
    
    // Call the parent component's onSave callback
    onSave(gameConfig);
  };
  
  if (!gameToConfig) return null;
  
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
            minHeight: 300,
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
                {gameToConfig.name} Setup
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={{ padding: 4 }}
              >
                <FontAwesome5 name="times" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ flex: 1 }}>
              {/* Game description */}
              <View style={styles.gameConfigSection}>
                <View style={styles.gameDescriptionContainer}>
                  <FontAwesome5 name={gameToConfig.icon || 'info-circle'} size={20} color={colors.primary} style={{ marginRight: 10 }} />
                  <Text style={[styles.gameDescription, { color: colors.textSecondary }]}>
                    {gameToConfig.description}
                  </Text>
                </View>
              </View>
              
              {/* Stake amount */}
              <View style={styles.gameConfigSection}>
                <Text style={[styles.gameConfigLabel, { color: colors.textPrimary }]}>Stake Amount ($)</Text>
                <TextInput
                  style={[styles.gameConfigInput, { 
                    color: colors.textPrimary,
                    borderColor: colors.border,
                    backgroundColor: colors.card
                  }]}
                  value={gameStake}
                  onChangeText={setGameStake}
                  keyboardType="numeric"
                  placeholder="Enter stake amount"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              {/* Game-specific settings */}
              {gameToConfig.type === 'nassau' && (
                <View style={styles.gameConfigSection}>
                  <Text style={[styles.gameConfigSectionTitle, { color: colors.textPrimary }]}>Nassau Settings</Text>
                  
                  <View style={styles.gameConfigRow}>
                    <Text style={[styles.gameConfigLabel, { color: colors.textPrimary }]}>Front Nine Stake ($)</Text>
                    <TextInput
                      style={[styles.gameConfigSmallInput, { 
                        color: colors.textPrimary,
                        borderColor: colors.border,
                        backgroundColor: colors.card
                      }]}
                      value={gameSettings.frontNineStake?.toString() || '1'}
                      onChangeText={(value) => setGameSettings({...gameSettings, frontNineStake: parseFloat(value) || 1})}
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  
                  <View style={styles.gameConfigRow}>
                    <Text style={[styles.gameConfigLabel, { color: colors.textPrimary }]}>Back Nine Stake ($)</Text>
                    <TextInput
                      style={[styles.gameConfigSmallInput, { 
                        color: colors.textPrimary,
                        borderColor: colors.border,
                        backgroundColor: colors.card
                      }]}
                      value={gameSettings.backNineStake?.toString() || '1'}
                      onChangeText={(value) => setGameSettings({...gameSettings, backNineStake: parseFloat(value) || 1})}
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  
                  <View style={styles.gameConfigRow}>
                    <Text style={[styles.gameConfigLabel, { color: colors.textPrimary }]}>Total Stake ($)</Text>
                    <TextInput
                      style={[styles.gameConfigSmallInput, { 
                        color: colors.textPrimary,
                        borderColor: colors.border,
                        backgroundColor: colors.card
                      }]}
                      value={gameSettings.totalStake?.toString() || '1'}
                      onChangeText={(value) => setGameSettings({...gameSettings, totalStake: parseFloat(value) || 1})}
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  
                  <View style={styles.gameConfigRow}>
                    <Text style={[styles.gameConfigLabel, { color: colors.textPrimary }]}>Use Press</Text>
                    <Switch
                      value={gameSettings.usePress || false}
                      onValueChange={(value) => setGameSettings({...gameSettings, usePress: value})}
                      trackColor={{ false: colors.border, true: colors.primary + '80' }}
                      thumbColor={gameSettings.usePress ? colors.primary : colors.secondaryLight}
                    />
                  </View>
                  
                  {gameSettings.usePress && (
                    <>
                      <View style={styles.gameConfigRow}>
                        <Text style={[styles.gameConfigLabel, { color: colors.textPrimary }]}>Automatic Press</Text>
                        <Switch
                          value={gameSettings.automaticPress || false}
                          onValueChange={(value) => setGameSettings({...gameSettings, automaticPress: value})}
                          trackColor={{ false: colors.border, true: colors.primary + '80' }}
                          thumbColor={gameSettings.automaticPress ? colors.primary : colors.secondaryLight}
                        />
                      </View>
                      
                      <View style={styles.gameConfigRow}>
                        <Text style={[styles.gameConfigLabel, { color: colors.textPrimary }]}>Press Amount ($)</Text>
                        <TextInput
                          style={[styles.gameConfigSmallInput, { 
                            color: colors.textPrimary,
                            borderColor: colors.border,
                            backgroundColor: colors.card
                          }]}
                          value={gameSettings.pressAmount?.toString() || '1'}
                          onChangeText={(value) => setGameSettings({...gameSettings, pressAmount: parseFloat(value) || 1})}
                          keyboardType="numeric"
                          placeholderTextColor={colors.textSecondary}
                        />
                      </View>
                    </>
                  )}
                </View>
              )}
              
              {gameToConfig.type === 'skins' && (
                <View style={styles.gameConfigSection}>
                  <Text style={[styles.gameConfigSectionTitle, { color: colors.textPrimary }]}>Skins Settings</Text>
                  
                  <View style={styles.gameConfigRow}>
                    <Text style={[styles.gameConfigLabel, { color: colors.textPrimary }]}>Carryover</Text>
                    <Switch
                      value={gameSettings.carryover || false}
                      onValueChange={(value) => setGameSettings({...gameSettings, carryover: value})}
                      trackColor={{ false: colors.border, true: colors.primary + '80' }}
                      thumbColor={gameSettings.carryover ? colors.primary : colors.secondaryLight}
                    />
                  </View>
                </View>
              )}
              
              {gameToConfig.type === 'stableford' && (
                <View style={styles.gameConfigSection}>
                  <Text style={[styles.gameConfigSectionTitle, { color: colors.textPrimary }]}>Stableford Settings</Text>
                  
                  <View style={styles.gameConfigRow}>
                    <Text style={[styles.gameConfigLabel, { color: colors.textPrimary }]}>Modified Scoring</Text>
                    <Switch
                      value={gameSettings.modifiedScoring || false}
                      onValueChange={(value) => setGameSettings({...gameSettings, modifiedScoring: value})}
                      trackColor={{ false: colors.border, true: colors.primary + '80' }}
                      thumbColor={gameSettings.modifiedScoring ? colors.primary : colors.secondaryLight}
                    />
                  </View>
                  
                  <Text style={[styles.gameConfigNote, { color: colors.textSecondary }]}>
                    {gameSettings.modifiedScoring ? 
                      'Modified: Double Bogey (0), Bogey (1), Par (2), Birdie (3), Eagle (4), Albatross (5)' : 
                      'Traditional: Double Bogey (-1), Bogey (0), Par (2), Birdie (3), Eagle (4), Albatross (5)'}
                  </Text>
                </View>
              )}
              
              {(gameToConfig.type === 'wolf' || gameToConfig.type === 'vegas') && (
                <View style={styles.gameConfigSection}>
                  <Text style={[styles.gameConfigSectionTitle, { color: colors.textPrimary }]}>Team Setup</Text>
                  
                  {players.map((player, index) => (
                    <View key={player.id} style={styles.gameConfigRow}>
                      <Text style={[styles.gameConfigLabel, { color: colors.textPrimary }]}>{player.name}</Text>
                      <View style={styles.teamSelector}>
                        {gameToConfig.type === 'wolf' ? (
                          // For Wolf, we just need to know the rotation order
                          <TextInput
                            style={[styles.gameConfigSmallInput, { 
                              color: colors.textPrimary,
                              borderColor: colors.border,
                              backgroundColor: colors.card,
                              width: 40,
                              textAlign: 'center'
                            }]}
                            value={(gameTeams[player.id] + 1).toString()}
                            onChangeText={(value) => {
                              const newOrder = parseInt(value) - 1;
                              if (!isNaN(newOrder) && newOrder >= 0) {
                                setGameTeams({...gameTeams, [player.id]: newOrder});
                              }
                            }}
                            keyboardType="numeric"
                            placeholderTextColor={colors.textSecondary}
                          />
                        ) : (
                          // For Vegas, we need to assign teams (A or B)
                          <View style={styles.teamButtons}>
                            <TouchableOpacity
                              style={[
                                styles.teamButton,
                                gameTeams[player.id] === 0 && { 
                                  backgroundColor: colors.primary,
                                  borderColor: colors.primary
                                }
                              ]}
                              onPress={() => setGameTeams({...gameTeams, [player.id]: 0})}
                            >
                              <Text style={[
                                styles.teamButtonText,
                                { color: gameTeams[player.id] === 0 ? colors.textLight : colors.textPrimary }
                              ]}>
                                Team A
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.teamButton,
                                gameTeams[player.id] === 1 && { 
                                  backgroundColor: colors.primary,
                                  borderColor: colors.primary
                                }
                              ]}
                              onPress={() => setGameTeams({...gameTeams, [player.id]: 1})}
                            >
                              <Text style={[
                                styles.teamButtonText,
                                { color: gameTeams[player.id] === 1 ? colors.textLight : colors.textPrimary }
                              ]}>
                                Team B
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={onClose}
                style={{ marginRight: SIZES.padding, flex: 1 }}
              />
              <Button
                title="Save"
                onPress={handleSave}
                style={{ flex: 1 }}
              />
            </View>
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
    width: '85%',
    minHeight: 250,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
  },
  modalTitle: {
    ...createFontStyle(FONTS.h4),
    marginBottom: SIZES.base,
    textAlign: 'center',
  },
  gameConfigSection: {
    marginBottom: SIZES.padding,
  },
  gameDescriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  gameDescription: {
    ...createFontStyle(FONTS.body5),
    flex: 1,
  },
  gameConfigLabel: {
    ...createFontStyle(FONTS.body5),
    marginBottom: SIZES.base / 2,
  },
  gameConfigInput: {
    height: 36,
    borderWidth: 1,
    borderRadius: SIZES.radius / 2,
    paddingHorizontal: SIZES.padding,
    fontSize: 14,
  },
  gameConfigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.base,
  },
  gameConfigSectionTitle: {
    ...createFontStyle(FONTS.h3),
    marginBottom: SIZES.base,
  },
  gameConfigSmallInput: {
    width: 80,
    height: 36,
    borderWidth: 1,
    borderRadius: SIZES.radius / 2,
    paddingHorizontal: SIZES.padding,
    fontSize: 14,
  },
  gameConfigNote: {
    ...createFontStyle(FONTS.body5),
    marginTop: SIZES.base,
    textAlign: 'center',
  },
  teamSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamButton: {
    padding: SIZES.padding * 0.5,
    borderWidth: 1,
    borderRadius: SIZES.radius / 2,
    marginRight: SIZES.base,
  },
  teamButtonText: {
    ...createFontStyle(FONTS.body4),
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.padding,
  },
});

export default GameConfigModal;
