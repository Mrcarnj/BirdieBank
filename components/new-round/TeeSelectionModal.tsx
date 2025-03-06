import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { FONTS, SIZES } from '../../constants/theme';
import { Course, Tee } from '../../store/slices/courseSlice';
import { createFontStyle } from '../../utils/styleUtils';
import { useTheme } from '../ThemeProvider';

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

interface Player {
  id: string;
  name: string;
  handicapIndex?: number;
  profileImageUrl?: string;
  isGuest?: boolean;
  userId?: string;
  email?: string;
}

interface TeeSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  player: Player;
  course: Course;
  onSelectTee: (player: Player, tee: Tee) => void;
}

const TeeSelectionModal: React.FC<TeeSelectionModalProps> = ({
  visible,
  onClose,
  player,
  course,
  onSelectTee,
}) => {
  const { colors } = useTheme();

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
            minHeight: 250
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
                Select Tee for {player?.name}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={{ padding: 4 }}
              >
                <FontAwesome5 name="times" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.teeList}>
              {course?.tee_sets?.map(teeSet => {
                const tee: Tee = {
                  id: teeSet.id,
                  name: teeSet.name,
                  color: teeSet.color || '#000000',
                  rating: teeSet.course_rating || 0,
                  slope: teeSet.slope_rating || 0
                };
                
                // Calculate course handicap if player has a handicap index
                const courseHandicap = player?.handicapIndex !== undefined && teeSet.slope_rating
                  ? Math.round(player.handicapIndex * (teeSet.slope_rating / 113) + 
                    ((teeSet.course_rating || 72) - (teeSet.par || 72)))
                  : undefined;
                
                return (
                  <TouchableOpacity
                    key={teeSet.id}
                    style={[styles.teeOption, { borderColor: colors.border }]}
                    onPress={() => player && onSelectTee(player, tee)}
                  >
                    <View style={[
                      styles.teeColorIndicator, 
                      { 
                        backgroundColor: teeSet.color || colors.primary,
                        // Add border for white tees
                        borderWidth: isLightColor(teeSet.color || '') ? 1 : 0,
                        borderColor: 'rgba(0, 0, 0, 0.3)'
                      }
                    ]} />
                    <View style={styles.teeOptionInfo}>
                      <Text style={[styles.teeName, { color: colors.textPrimary }]}>{teeSet.name}</Text>
                      <Text style={[styles.teeDetails, { color: colors.textSecondary }]}>
                        {teeSet.total_yardage} Yds / {teeSet.course_rating} / {teeSet.slope_rating}
                      </Text>
                    </View>
                    {courseHandicap !== undefined && (
                      <View style={styles.courseHandicapContainer}>
                        <Text style={[styles.courseHandicapLabel, { color: colors.textSecondary }]}>CH:</Text>
                        <Text style={[styles.courseHandicapValue, { color: colors.primary }]}>
                          {formatCourseHandicap(courseHandicap)}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
  teeList: {
    maxHeight: 400,
  },
  teeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    borderWidth: 1,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.base,
  },
  teeColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: SIZES.base,
  },
  teeOptionInfo: {
    flex: 1,
    marginLeft: SIZES.base,
  },
  teeName: {
    ...createFontStyle(FONTS.body3),
    fontWeight: '500',
    marginBottom: SIZES.base / 2,
  },
  teeDetails: {
    ...createFontStyle(FONTS.body5),
  },
  courseHandicapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseHandicapLabel: {
    ...createFontStyle(FONTS.body5),
    marginRight: 4,
  },
  courseHandicapValue: {
    ...createFontStyle(FONTS.body4),
    fontWeight: '500',
  },
});

export default TeeSelectionModal;
