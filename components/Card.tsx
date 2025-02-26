import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

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
  const getCardStyle = (): ViewStyle => {
    let cardStyle: ViewStyle = {
      backgroundColor: COLORS.card,
      borderRadius: SIZES.radius,
      padding: SIZES.padding,
    };

    switch (variant) {
      case 'default':
        cardStyle = {
          ...cardStyle,
          ...SHADOWS.light,
        };
        break;
      case 'elevated':
        cardStyle = {
          ...cardStyle,
          ...SHADOWS.dark,
        };
        break;
      case 'outlined':
        cardStyle = {
          ...cardStyle,
          borderWidth: 1,
          borderColor: COLORS.border,
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
    width: '100%',
    marginVertical: SIZES.base,
  },
});

export default Card; 