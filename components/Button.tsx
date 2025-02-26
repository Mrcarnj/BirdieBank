import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import * as Haptics from 'expo-haptics';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  onPress: () => void;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  onPress,
  ...rest
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const getButtonStyle = (): ViewStyle => {
    let buttonStyle: ViewStyle = {};

    // Variant styles
    switch (variant) {
      case 'primary':
        buttonStyle = {
          backgroundColor: COLORS.primary,
          borderWidth: 0,
        };
        break;
      case 'secondary':
        buttonStyle = {
          backgroundColor: COLORS.secondary,
          borderWidth: 0,
        };
        break;
      case 'outline':
        buttonStyle = {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: COLORS.primary,
        };
        break;
      case 'text':
        buttonStyle = {
          backgroundColor: 'transparent',
          borderWidth: 0,
          paddingHorizontal: 0,
        };
        break;
    }

    // Size styles
    switch (size) {
      case 'small':
        buttonStyle = {
          ...buttonStyle,
          paddingVertical: SIZES.base,
          paddingHorizontal: SIZES.base * 2,
          borderRadius: SIZES.radius - 4,
        };
        break;
      case 'medium':
        buttonStyle = {
          ...buttonStyle,
          paddingVertical: SIZES.base * 1.5,
          paddingHorizontal: SIZES.base * 3,
          borderRadius: SIZES.radius,
        };
        break;
      case 'large':
        buttonStyle = {
          ...buttonStyle,
          paddingVertical: SIZES.base * 2,
          paddingHorizontal: SIZES.base * 4,
          borderRadius: SIZES.radius,
        };
        break;
    }

    // Disabled style
    if (disabled) {
      buttonStyle = {
        ...buttonStyle,
        opacity: 0.5,
      };
    }

    return buttonStyle;
  };

  const getTextStyle = (): TextStyle => {
    let textStyleObj: TextStyle = {
      ...FONTS.body4,
      fontWeight: '600',
    };

    // Variant text styles
    switch (variant) {
      case 'primary':
        textStyleObj = {
          ...textStyleObj,
          color: COLORS.secondary,
        };
        break;
      case 'secondary':
        textStyleObj = {
          ...textStyleObj,
          color: COLORS.textPrimary,
        };
        break;
      case 'outline':
        textStyleObj = {
          ...textStyleObj,
          color: COLORS.primary,
        };
        break;
      case 'text':
        textStyleObj = {
          ...textStyleObj,
          color: COLORS.primary,
        };
        break;
    }

    // Size text styles
    switch (size) {
      case 'small':
        textStyleObj = {
          ...textStyleObj,
          ...FONTS.body5,
        };
        break;
      case 'medium':
        textStyleObj = {
          ...textStyleObj,
          ...FONTS.body4,
        };
        break;
      case 'large':
        textStyleObj = {
          ...textStyleObj,
          ...FONTS.body3,
        };
        break;
    }

    return textStyleObj;
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle(), style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? COLORS.secondary : COLORS.primary}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  text: {
    marginHorizontal: SIZES.base,
  },
});

export default Button; 