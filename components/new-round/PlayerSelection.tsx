import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { FONTS, SIZES } from '../../constants/theme';
import { RootState, AppDispatch } from '../../store';
import { Course, Tee } from '../../store/slices/courseSlice';
import { selectPlayer, PlayerWithTee } from '../../store/slices/playerSlice';
import { createFontStyle } from '../../utils/styleUtils';
import { useTheme } from '../ThemeProvider';
import Card from '../Card';
import Button from '../Button';

// Helper function to determine if a color is white or very light
const isLightColor = (color: string) => {
  // Check if color is white or very close to white
  return color === '#FFFFFF' || color === '#FFF' || color === 'white' || color.toLowerCase() === '#ffffff';
};

// Helper function to format course handicap with proper golf notation
const formatCourseHandicap = (handicap: number): string => {
  if (handicap < 0) {
    return `+${Math.abs(handicap)}`;
  }
  return handicap.toString();
};

// Extend the Player interface to include email
interface Player {
  id: string;
  name: string;
  handicapIndex?: number;
  profileImageUrl?: string;
  isGuest?: boolean;
  userId?: string;
  email?: string;
}

interface PlayerSelectionProps {
  selectedCourse: Course | null;
  selectedPlayers: PlayerWithTee[];
  holeSelection: 'front9' | 'back9' | 'full18' | 'custom';
  startingHole: number;
  onBack: () => void;
  onNext: () => void;
  onAddPlayer: () => void;
  onOpenTeeSelection: (player: Player) => void;
}

const PlayerSelection: React.FC<PlayerSelectionProps> = ({
  selectedCourse,
  selectedPlayers,
  holeSelection,
  startingHole,
  onBack,
  onNext,
  onAddPlayer,
  onOpenTeeSelection,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { colors } = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);
  const { players } = useSelector((state: RootState) => state.player);

  // Handle player selection
  const handlePlayerSelect = (player: Player, tee: Tee | null) => {
    dispatch(selectPlayer({ player, tee }));
  };

  // Get the list of selected player IDs
  const selectedPlayerIds = selectedPlayers.map(p => p.id);
  
  // Filter the players list to only include selected players (except the user)
  const filteredPlayers = players.filter(player => 
    selectedPlayerIds.includes(player.id) || player.id === user?.id
  );
  
  // Sort players to put the logged-in user first
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (user && a.id === user.id) return -1;
    if (user && b.id === user.id) return 1;
    return 0;
  });

  return (
    <View style={styles.container}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Select Players</Text>
      
      {selectedCourse && (
        <Card style={{
          ...styles.selectedCourseCard,
          backgroundColor: colors.card,
          borderColor: colors.primary,
          borderLeftWidth: 4,
          borderLeftColor: colors.primary,
        }}>
          <View style={styles.selectedCourseHeader}>
            <Text style={[styles.selectedCourseName, { color: colors.textPrimary, fontWeight: '600' }]}>
              {selectedCourse.name}
            </Text>
            <TouchableOpacity onPress={onBack}>
              <Text style={[styles.changeText, { color: colors.primary }]}>Change</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.selectedCourseDetails, { color: colors.textPrimary, opacity: 0.8 }]}>
            {(selectedCourse.holes || []).length} holes • {(selectedCourse.tee_sets || []).length} tee options
          </Text>
        </Card>
      )}
      
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Players in this Round</Text>
          <Button 
            title="Add Players" 
            size="small"
            variant="outline"
            onPress={onAddPlayer}
            icon={<FontAwesome5 name="plus" size={12} color={colors.primary} style={{ marginRight: 4 }} />}
            style={{ borderColor: colors.primary, borderWidth: 1 }}
          />
        </View>
        
        {/* Display the user card */}
        {user && (
          <Card
            key={user.id}
            style={{
              ...styles.playerCard,
              backgroundColor: selectedPlayers.some(p => p.id === user.id) ? 'rgba(0, 0, 0, 0.05)' : colors.card,
              borderColor: selectedPlayers.some(p => p.id === user.id) ? colors.primary : colors.border,
              borderLeftWidth: 4,
              borderLeftColor: colors.primary,
              padding: SIZES.padding * 0.75,
            }}
          >
            <View style={styles.playerInfo}>
              <View style={styles.playerNameContainer}>
                <Text style={[styles.playerName, { color: colors.textPrimary, fontWeight: '600' }]}>
                  {user.name || 
                    (user.first_name && user.last_name 
                      ? `${user.first_name} ${user.last_name}`
                      : user.first_name || user.last_name || user.email.split('@')[0])} (You)
                </Text>
                
                <View style={styles.handicapRow}>
                  {user.handicap !== undefined && (
                    <Text style={[styles.handicap, { color: colors.textPrimary, opacity: 0.8 }]}>
                      HCP: {user.handicap}
                    </Text>
                  )}
                  
                  {user && selectedPlayers.some(p => p.id === user.id) && 
                   selectedPlayers.find(p => p.id === user.id)?.selectedTee && 
                   user.handicap !== undefined && (
                    <Text style={[styles.courseHandicap, { color: colors.primary }]}>
                      {' • CH: '}
                      {formatCourseHandicap(Math.round(user.handicap * 
                        (selectedPlayers.find(p => p.id === user.id)?.selectedTee?.slope || 113) / 113 + 
                        ((selectedPlayers.find(p => p.id === user.id)?.selectedTee?.rating || 72) - 
                        (selectedCourse?.tee_sets?.find(
                          teeSet => teeSet.id === selectedPlayers.find(p => p.id === user.id)?.selectedTee?.id
                        )?.par || 72))
                      ))}
                    </Text>
                  )}
                </View>
                
                {user && selectedPlayers.some(p => p.id === user.id) && (
                  selectedPlayers.find(p => p.id === user.id)?.selectedTee ? (
                    <View style={styles.condensedTeeInfo}>
                      <View style={styles.teeNameRow}>
                        <View style={[
                          styles.teeColorIndicator, 
                          { 
                            backgroundColor: selectedPlayers.find(p => p.id === user.id)?.selectedTee?.color || colors.primary,
                            marginRight: 4,
                            // Add border for white tees
                            borderWidth: isLightColor(selectedPlayers.find(p => p.id === user.id)?.selectedTee?.color || '') ? 1 : 0,
                            borderColor: 'rgba(0, 0, 0, 0.3)'
                          }
                        ]} />
                        <Text style={[styles.teeName, { color: colors.textPrimary }]}>
                          {selectedPlayers.find(p => p.id === user.id)?.selectedTee?.name}
                        </Text>
                        
                        {selectedCourse?.tee_sets?.find(teeSet => teeSet.id === selectedPlayers.find(p => p.id === user.id)?.selectedTee?.id) && (
                          <Text style={[styles.teeDetailText, { color: colors.textSecondary }]}>
                            {' • '}
                            {selectedCourse?.tee_sets?.find(teeSet => teeSet.id === selectedPlayers.find(p => p.id === user.id)?.selectedTee?.id)?.total_yardage} Yds / {' '}
                            {selectedPlayers.find(p => p.id === user.id)?.selectedTee?.rating} / {' '}
                            {selectedPlayers.find(p => p.id === user.id)?.selectedTee?.slope}
                          </Text>
                        )}
                        
                        <TouchableOpacity 
                          style={styles.changeTeeButton}
                          onPress={() => {
                            if (user) {
                              const userName = user.name || 
                                (user.first_name && user.last_name 
                                  ? `${user.first_name} ${user.last_name}`
                                  : user.first_name || user.last_name || user.email.split('@')[0]);
                              
                              onOpenTeeSelection({ 
                                id: user.id, 
                                name: userName,
                                handicapIndex: user.handicap,
                                profileImageUrl: user.profile_image_url
                              });
                            }
                          }}
                        >
                          <Text style={[styles.changeTeeText, { color: colors.primary, marginLeft: 4 }]}>Change</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.selectTeeButton}
                      onPress={() => {
                        if (user) {
                          const userName = user.name || 
                            (user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}`
                              : user.first_name || user.last_name || user.email.split('@')[0]);
                          
                          onOpenTeeSelection({ 
                            id: user.id, 
                            name: userName,
                            handicapIndex: user.handicap,
                            profileImageUrl: user.profile_image_url
                          });
                        }
                      }}
                    >
                      <Text style={[styles.selectTeeText, { color: colors.primary }]}>Select Tee</Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
              
              {!selectedPlayers.some(p => p.id === user.id) && (
                <Button
                  title="Select Tee"
                  size="small"
                  onPress={() => {
                    if (selectedCourse && selectedCourse.tee_sets && selectedCourse.tee_sets.length > 0) {
                      const userName = user.name || 
                        (user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user.first_name || user.last_name || user.email.split('@')[0]);
                      
                      // Open tee selection modal instead of automatically selecting the first tee
                      onOpenTeeSelection({ 
                        id: user.id, 
                        name: userName,
                        handicapIndex: user.handicap,
                        profileImageUrl: user.profile_image_url
                      });
                    } else {
                      const userName = user.name || 
                        (user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user.first_name || user.last_name || user.email.split('@')[0]);
                      
                      handlePlayerSelect({ 
                        id: user.id, 
                        name: userName,
                        handicapIndex: user.handicap,
                        profileImageUrl: user.profile_image_url
                      }, null);
                    }
                  }}
                />
              )}
            </View>
          </Card>
        )}
        
        {/* Display other selected players */}
        {sortedPlayers
          .filter(player => !user || player.id !== user.id) // Filter out the logged-in user since we already displayed them
          .map(player => {
            const isSelected = selectedPlayers.some(p => p.id === player.id);
            const selectedPlayerTee = selectedPlayers.find(p => p.id === player.id)?.selectedTee;
            
            // Only display players that are selected
            if (!isSelected) return null;
            
            return (
              <Card
                key={player.id}
                style={{
                  ...styles.playerCard,
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  borderColor: colors.primary,
                  padding: SIZES.padding * 0.75,
                }}
              >
                <View style={styles.playerInfo}>
                  <View style={styles.playerNameContainer}>
                    <Text style={[styles.playerName, { color: colors.textPrimary, fontWeight: '600' }]}>{player.name}</Text>
                    
                    <View style={styles.handicapRow}>
                      {player.handicapIndex !== undefined && (
                        <Text style={[styles.handicap, { color: colors.textPrimary, opacity: 0.8 }]}>
                          HCP: {player.handicapIndex}
                        </Text>
                      )}
                      
                      {isSelected && selectedPlayerTee && player.handicapIndex !== undefined && (
                        <Text style={[styles.courseHandicap, { color: colors.primary }]}>
                          {' • CH: '}
                          {formatCourseHandicap(Math.round(player.handicapIndex * 
                            (selectedPlayerTee.slope || 113) / 113 + 
                            ((selectedPlayerTee.rating || 72) - 
                            (selectedCourse?.tee_sets?.find(
                              teeSet => teeSet.id === selectedPlayerTee.id
                            )?.par || 72))
                          ))}
                        </Text>
                      )}
                    </View>
                    
                    {isSelected && (
                      selectedPlayerTee ? (
                        <View style={styles.condensedTeeInfo}>
                          <View style={styles.teeNameRow}>
                            <View style={[
                              styles.teeColorIndicator, 
                              { 
                                backgroundColor: selectedPlayerTee.color || colors.primary,
                                marginRight: 4,
                                // Add border for white tees
                                borderWidth: isLightColor(selectedPlayerTee.color || '') ? 1 : 0,
                                borderColor: 'rgba(0, 0, 0, 0.3)'
                              }
                            ]} />
                            <Text style={[styles.teeName, { color: colors.textPrimary }]}>
                              {selectedPlayerTee.name}
                            </Text>
                            
                            {selectedCourse?.tee_sets?.find(teeSet => teeSet.id === selectedPlayerTee.id) && (
                              <Text style={[styles.teeDetailText, { color: colors.textSecondary }]}>
                                {' • '}
                                {selectedCourse?.tee_sets?.find(teeSet => teeSet.id === selectedPlayerTee.id)?.total_yardage} Yds / {' '}
                                {selectedPlayerTee.rating} / {' '}
                                {selectedPlayerTee.slope}
                              </Text>
                            )}
                            
                            <TouchableOpacity 
                              style={styles.changeTeeButton}
                              onPress={() => onOpenTeeSelection(player)}
                            >
                              <Text style={[styles.changeTeeText, { color: colors.primary, marginLeft: 4 }]}>Change</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity 
                          style={styles.selectTeeButton}
                          onPress={() => onOpenTeeSelection(player)}
                        >
                          <Text style={[styles.selectTeeText, { color: colors.primary }]}>Select Tee</Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.removeButton, { backgroundColor: colors.error + '20' }]}
                    onPress={() => handlePlayerSelect(player, null)}
                  >
                    <FontAwesome5 name="times" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })}
      </View>
      
      <View style={styles.holeSelectionContainer}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Hole Selection</Text>
        <View style={styles.holeOptions}>
          <TouchableOpacity
            style={[
              styles.holeOption,
              holeSelection === 'front9' && { backgroundColor: colors.primary }
            ]}
          >
            <Text style={[
              styles.holeOptionText,
              { color: holeSelection === 'front9' ? colors.textLight : colors.textPrimary }
            ]}>
              Front 9
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.holeOption,
              holeSelection === 'back9' && { backgroundColor: colors.primary }
            ]}
          >
            <Text style={[
              styles.holeOptionText,
              { color: holeSelection === 'back9' ? colors.textLight : colors.textPrimary }
            ]}>
              Back 9
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.holeOption,
              holeSelection === 'full18' && { backgroundColor: colors.primary }
            ]}
          >
            <Text style={[
              styles.holeOptionText,
              { color: holeSelection === 'full18' ? colors.textLight : colors.textPrimary }
            ]}>
              Full 18
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Starting Hole Selection */}
        <View style={styles.startingHoleContainer}>
          <Text style={[styles.sectionSubtitle, { color: colors.textPrimary }]}>Starting Hole</Text>
          <View style={styles.startingHolePickerContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.startingHolePicker}
            >
              {Array.from({ length: holeSelection === 'front9' ? 9 : holeSelection === 'back9' ? 9 : 18 }).map((_, index) => {
                const holeNumber = holeSelection === 'front9' ? index + 1 : 
                                  holeSelection === 'back9' ? index + 10 : 
                                  index + 1;
                
                return (
                  <TouchableOpacity
                    key={holeNumber}
                    style={[
                      styles.startingHoleOption,
                      startingHole === holeNumber && { 
                        backgroundColor: colors.primary,
                        borderColor: colors.primary
                      }
                    ]}
                  >
                    <Text style={[
                      styles.startingHoleText,
                      { color: startingHole === holeNumber ? colors.textLight : colors.textPrimary }
                    ]}>
                      {holeNumber}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
          <Text style={[styles.startingHoleDescription, { color: colors.textSecondary }]}>
            {holeSelection === 'front9' && `Playing holes ${startingHole}-9, then 1-${startingHole - 1 > 0 ? startingHole - 1 : ''}`}
            {holeSelection === 'back9' && `Playing holes ${startingHole}-18, then 10-${startingHole - 1 > 9 ? startingHole - 1 : ''}`}
            {holeSelection === 'full18' && startingHole === 1 ? 'Playing holes 1-18' : 
             holeSelection === 'full18' && `Playing holes ${startingHole}-18, then 1-${startingHole - 1}`}
          </Text>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Back"
          variant="outline"
          onPress={onBack}
          style={styles.backButton}
        />
        <Button
          title="Next"
          onPress={onNext}
          disabled={selectedPlayers.length === 0}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepTitle: {
    ...createFontStyle(FONTS.h2),
    marginBottom: SIZES.padding,
    marginTop: 0,
  },
  selectedCourseCard: {
    marginBottom: SIZES.padding,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    borderWidth: 1,
  },
  selectedCourseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  selectedCourseName: {
    ...createFontStyle(FONTS.h4),
  },
  selectedCourseDetails: {
    ...createFontStyle(FONTS.body4),
  },
  changeText: {
    ...createFontStyle(FONTS.body4),
    fontWeight: 'bold',
  },
  sectionContainer: {
    marginBottom: SIZES.padding,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base * 1.5,
  },
  sectionTitle: {
    ...createFontStyle(FONTS.h3),
    marginBottom: SIZES.base * 1.5,
  },
  playerCard: {
    marginBottom: SIZES.base,
    borderRadius: SIZES.radius,
    borderWidth: 1,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerNameContainer: {
    flex: 1,
  },
  playerName: {
    ...createFontStyle(FONTS.h4),
    marginBottom: 2,
  },
  handicapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  handicap: {
    ...createFontStyle(FONTS.body4),
  },
  courseHandicap: {
    ...createFontStyle(FONTS.body4),
    fontWeight: '500',
  },
  condensedTeeInfo: {
    marginTop: 4,
  },
  teeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  teeColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  teeName: {
    ...createFontStyle(FONTS.body4),
    fontWeight: '500',
  },
  teeDetailText: {
    ...createFontStyle(FONTS.body5),
  },
  changeTeeButton: {
    padding: SIZES.base / 2,
  },
  changeTeeText: {
    ...createFontStyle(FONTS.body4),
    fontWeight: '500',
  },
  selectTeeButton: {
    padding: SIZES.base,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: SIZES.radius / 2,
    marginTop: SIZES.base / 2,
  },
  selectTeeText: {
    ...createFontStyle(FONTS.body4),
    fontWeight: '500',
  },
  removeButton: {
    padding: SIZES.base,
    borderRadius: SIZES.radius,
  },
  holeSelectionContainer: {
    marginBottom: SIZES.padding,
  },
  holeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SIZES.base,
  },
  holeOption: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius,
    marginRight: SIZES.base,
    marginBottom: SIZES.base,
    borderWidth: 1,
  },
  holeOptionText: {
    ...createFontStyle(FONTS.body4),
    fontWeight: '500',
  },
  startingHoleContainer: {
    marginTop: SIZES.padding,
  },
  sectionSubtitle: {
    ...createFontStyle(FONTS.h4),
    marginBottom: SIZES.base,
  },
  startingHolePickerContainer: {
    borderWidth: 1,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginTop: SIZES.base,
  },
  startingHolePicker: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startingHoleOption: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.base,
  },
  startingHoleText: {
    ...createFontStyle(FONTS.body4),
    fontWeight: '500',
  },
  startingHoleDescription: {
    ...createFontStyle(FONTS.body5),
    marginTop: SIZES.base,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  backButton: {
    width: '48%',
  },
});

export default PlayerSelection;
