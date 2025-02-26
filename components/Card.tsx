import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { SIZES } from '../constants/theme';
import { useTheme } from './ThemeProvider';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  onPress?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  onPress,
  ...rest
}) => {
  const { colors, shadows } = useTheme();

  const getCardStyle = (): ViewStyle => {
    let cardStyle: ViewStyle = {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius,
      padding: SIZES.padding,
    };

    switch (variant) {
      case 'default':
        cardStyle = {
          ...cardStyle,
          ...shadows.light,
        };
        break;
      case 'elevated':
        cardStyle = {
          ...cardStyle,
          ...shadows.dark,
        };
        break;
      case 'outlined':
        cardStyle = {
          ...cardStyle,
          borderWidth: 1,
          borderColor: colors.border,
          shadowOpacity: 0,
          elevation: 0,
        };
        break;
    }

    return cardStyle;
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.container, getCardStyle(), style]}
        onPress={onPress}
        activeOpacity={0.9}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, getCardStyle(), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.base,
  },
});

export default Card; 