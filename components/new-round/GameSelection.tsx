import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesome5 } from '@expo/vector-icons';
import { FONTS, SIZES } from '../../constants/theme';
import { RootState, AppDispatch } from '../../store';
import { Course } from '../../store/slices/courseSlice';
import { PlayerWithTee } from '../../store/slices/playerSlice';
import { selectGame, removeGame } from '../../store/slices/gameSlice';
import Card from '../Card';
import Button from '../Button';
import { createFontStyle } from '../../utils/styleUtils';
import { useTheme } from '../ThemeProvider';
import { GAME_TYPES } from '../../utils/games';

interface GameSelectionProps {
  selectedCourse: Course | null;
  selectedPlayers: PlayerWithTee[];
  holeSelection: string;
  startingHole: number;
  onBack: () => void;
  onStartRound: () => void;
  onGameSelect: (gameType: string) => void;
}

const GameSelection: React.FC<GameSelectionProps> = ({
  selectedCourse,
  selectedPlayers,
  holeSelection,
  startingHole,
  onBack,
  onStartRound,
  onGameSelect
}) => {
  const { selectedGames } = useSelector((state: RootState) => state.game);
  const { colors } = useTheme();

  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Game Options</Text>
      
      <Card style={styles.summaryCard}>
        <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Round Summary</Text>
        
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Course:</Text>
          <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{selectedCourse?.name}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Players:</Text>
          <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{selectedPlayers.length}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Holes:</Text>
          <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
            {holeSelection === 'front9' ? 'Front 9' :
             holeSelection === 'back9' ? 'Back 9' :
             holeSelection === 'full18' ? 'Full 18' :
             `Custom (Starting at hole ${startingHole})`}
          </Text>
        </View>
      </Card>
      
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Select Game Type (Optional)</Text>
        <View style={styles.gameGrid}>
          {GAME_TYPES.map(game => {
            const isSelected = selectedGames.some(g => g.type === game.type);
            return (
              <TouchableOpacity
                key={game.type}
                style={[
                  styles.gameCard,
                  { backgroundColor: isSelected ? colors.primary : colors.card },
                  isSelected ? {} : { borderColor: colors.border, borderWidth: 1 }
                ]}
                onPress={() => onGameSelect(game.type)}
              >
                <FontAwesome5
                  name={game.icon}
                  size={24}
                  color={isSelected ? colors.textLight : colors.primary}
                  style={styles.gameIcon}
                />
                <Text style={[
                  styles.gameName,
                  { color: isSelected ? colors.textLight : colors.textPrimary }
                ]}>
                  {game.name}
                </Text>
                <Text style={[
                  styles.gameDescription,
                  { color: isSelected ? colors.textLight + 'DD' : colors.textSecondary }
                ]}>
                  {game.description}
                </Text>
              </TouchableOpacity>
            );
          })}
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
          title="Start Round"
          onPress={onStartRound}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    ...createFontStyle(FONTS.h2),
    marginBottom: SIZES.padding,
  },
  summaryCard: {
    marginBottom: SIZES.padding,
    padding: SIZES.padding,
  },
  summaryTitle: {
    ...createFontStyle(FONTS.h3),
    marginBottom: SIZES.padding,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.base,
  },
  summaryLabel: {
    ...createFontStyle(FONTS.body4),
    fontWeight: '500',
  },
  summaryValue: {
    ...createFontStyle(FONTS.body4),
  },
  sectionContainer: {
    marginBottom: SIZES.padding * 2,
  },
  sectionTitle: {
    ...createFontStyle(FONTS.h3),
    marginBottom: SIZES.padding,
  },
  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gameCard: {
    width: '48%',
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
  },
  gameIcon: {
    marginBottom: SIZES.base,
  },
  gameName: {
    ...createFontStyle(FONTS.h4),
    marginBottom: SIZES.base / 2,
  },
  gameDescription: {
    ...createFontStyle(FONTS.body5),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.padding,
  },
  backButton: {
    marginRight: SIZES.padding,
  },
});

export default GameSelection;
