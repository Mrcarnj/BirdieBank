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
import { FONTS, SIZES } from '../constants/theme';
import * as Haptics from 'expo-haptics';
import { useTheme } from './ThemeProvider';

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
  const { colors } = useTheme();

  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const getButtonStyle = (): ViewStyle => {
    let buttonStyle: ViewStyle = {
      ...styles.button,
      opacity: disabled ? 0.6 : 1,
    };

    // Size styles
    switch (size) {
      case 'small':
        buttonStyle = {
          ...buttonStyle,
          paddingVertical: SIZES.base,
          paddingHorizontal: SIZES.padding / 2,
          borderRadius: SIZES.radius / 1.5,
        };
        break;
      case 'large':
        buttonStyle = {
          ...buttonStyle,
          paddingVertical: SIZES.padding / 1.5,
          paddingHorizontal: SIZES.padding,
          borderRadius: SIZES.radius * 1.5,
        };
        break;
      default:
        buttonStyle = {
          ...buttonStyle,
          paddingVertical: SIZES.padding / 2,
          paddingHorizontal: SIZES.padding,
          borderRadius: SIZES.radius,
        };
    }

    // Variant styles
    switch (variant) {
      case 'primary':
        buttonStyle = {
          ...buttonStyle,
          backgroundColor: colors.primary,
        };
        break;
      case 'secondary':
        buttonStyle = {
          ...buttonStyle,
          backgroundColor: colors.secondary,
          borderWidth: 1,
          borderColor: colors.primary,
        };
        break;
      case 'outline':
        buttonStyle = {
          ...buttonStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.primary,
        };
        break;
      case 'text':
        buttonStyle = {
          ...buttonStyle,
          backgroundColor: 'transparent',
          paddingHorizontal: 0,
          paddingVertical: 0,
        };
        break;
    }

    return buttonStyle;
  };

  const getTextStyle = (): TextStyle => {
    let textStyleObj: TextStyle = {
      ...styles.text,
    };

    // Size styles
    switch (size) {
      case 'small':
        textStyleObj = {
          ...textStyleObj,
          fontSize: FONTS.body5.fontSize,
        };
        break;
      case 'large':
        textStyleObj = {
          ...textStyleObj,
          fontSize: FONTS.body3.fontSize,
        };
        break;
      default:
        textStyleObj = {
          ...textStyleObj,
          fontSize: FONTS.body4.fontSize,
        };
    }

    // Variant styles
    switch (variant) {
      case 'primary':
        textStyleObj = {
          ...textStyleObj,
          color: colors.textLight,
        };
        break;
      case 'secondary':
        textStyleObj = {
          ...textStyleObj,
          color: colors.primary,
        };
        break;
      case 'outline':
        textStyleObj = {
          ...textStyleObj,
          color: colors.primary,
        };
        break;
      case 'text':
        textStyleObj = {
          ...textStyleObj,
          color: colors.primary,
        };
        break;
    }

    return textStyleObj;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.textLight : colors.primary}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
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
  },
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Button; 