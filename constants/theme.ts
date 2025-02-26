import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  // Primary colors
  primary: '#0A5F38', // Dark green
  primaryLight: '#1A7D4E',
  primaryDark: '#054025',
  
  // Secondary colors
  secondary: '#FFFFFF', // White
  secondaryLight: '#F5F5F5',
  secondaryDark: '#E0E0E0',
  
  // Accent colors
  accent: '#FFD700', // Gold
  accentLight: '#FFEB3B',
  accentDark: '#FFC107',
  
  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Text colors
  textPrimary: '#212121',
  textSecondary: '#757575',
  textLight: '#FFFFFF',
  textDark: '#000000',
  
  // Background colors
  background: '#F9F9F9',
  card: '#FFFFFF',
  
  // Border colors
  border: '#E0E0E0',
  
  // Transparent colors
  transparent: 'transparent',
  transparentBlack: 'rgba(0, 0, 0, 0.5)',
  transparentWhite: 'rgba(255, 255, 255, 0.5)',
  
  // Golf-specific colors
  fairway: '#7CB342',
  rough: '#558B2F',
  sand: '#FFD54F',
  water: '#29B6F6',
  green: '#2E7D32',
  tee: '#8D6E63',
};

export const SIZES = {
  // Global sizes
  base: 8,
  font: 14,
  radius: 12,
  padding: 24,
  margin: 20,
  
  // Font sizes
  largeTitle: 40,
  h1: 30,
  h2: 22,
  h3: 18,
  h4: 16,
  h5: 14,
  body1: 30,
  body2: 22,
  body3: 16,
  body4: 14,
  body5: 12,
  
  // App dimensions
  width,
  height,
};

export const FONTS = {
  largeTitle: { fontFamily: 'System', fontSize: SIZES.largeTitle, lineHeight: 55 },
  h1: { fontFamily: 'System', fontSize: SIZES.h1, lineHeight: 36, fontWeight: 'bold' },
  h2: { fontFamily: 'System', fontSize: SIZES.h2, lineHeight: 30, fontWeight: 'bold' },
  h3: { fontFamily: 'System', fontSize: SIZES.h3, lineHeight: 22, fontWeight: 'bold' },
  h4: { fontFamily: 'System', fontSize: SIZES.h4, lineHeight: 20, fontWeight: 'bold' },
  h5: { fontFamily: 'System', fontSize: SIZES.h5, lineHeight: 18, fontWeight: 'bold' },
  body1: { fontFamily: 'System', fontSize: SIZES.body1, lineHeight: 36 },
  body2: { fontFamily: 'System', fontSize: SIZES.body2, lineHeight: 30 },
  body3: { fontFamily: 'System', fontSize: SIZES.body3, lineHeight: 22 },
  body4: { fontFamily: 'System', fontSize: SIZES.body4, lineHeight: 20 },
  body5: { fontFamily: 'System', fontSize: SIZES.body5, lineHeight: 18 },
};

export const SHADOWS = {
  light: {
    shadowColor: COLORS.textDark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  medium: {
    shadowColor: COLORS.textDark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  dark: {
    shadowColor: COLORS.textDark,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 7,
    elevation: 5,
  },
};

const appTheme = { COLORS, SIZES, FONTS, SHADOWS };

export default appTheme; 