import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Light theme colors
export const LIGHT_COLORS = {
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

// Dark theme colors
export const DARK_COLORS = {
  // Primary colors
  primary: '#1A7D4E', // Lighter green for better contrast
  primaryLight: '#2A8D5E',
  primaryDark: '#0A5F38',
  
  // Secondary colors
  secondary: '#121212', // Dark background
  secondaryLight: '#1E1E1E',
  secondaryDark: '#0A0A0A',
  
  // Accent colors
  accent: '#FFD700', // Gold (same)
  accentLight: '#FFEB3B',
  accentDark: '#FFC107',
  
  // Status colors
  success: '#66BB6A', // Lighter green
  warning: '#FFA726', // Lighter orange
  error: '#EF5350', // Lighter red
  info: '#42A5F5', // Lighter blue
  
  // Text colors
  textPrimary: '#E0E0E0', // Light grey
  textSecondary: '#AAAAAA', // Medium grey
  textLight: '#FFFFFF', // White
  textDark: '#121212', // Dark
  
  // Background colors
  background: '#121212', // Dark background
  card: '#1E1E1E', // Slightly lighter than background
  
  // Border colors
  border: '#333333', // Dark grey
  
  // Transparent colors
  transparent: 'transparent',
  transparentBlack: 'rgba(0, 0, 0, 0.5)',
  transparentWhite: 'rgba(255, 255, 255, 0.5)',
  
  // Golf-specific colors
  fairway: '#558B2F', // Darker green
  rough: '#33691E', // Even darker green
  sand: '#F9A825', // Darker yellow
  water: '#0277BD', // Darker blue
  green: '#1B5E20', // Darker green
  tee: '#6D4C41', // Darker brown
};

// Default to light colors
export const COLORS = LIGHT_COLORS;

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

// Function to get shadow based on theme
export const getShadows = (isDarkMode: boolean) => ({
  light: {
    shadowColor: isDarkMode ? DARK_COLORS.textLight : LIGHT_COLORS.textDark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: isDarkMode ? 0.2 : 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  medium: {
    shadowColor: isDarkMode ? DARK_COLORS.textLight : LIGHT_COLORS.textDark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: isDarkMode ? 0.25 : 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  dark: {
    shadowColor: isDarkMode ? DARK_COLORS.textLight : LIGHT_COLORS.textDark,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: isDarkMode ? 0.3 : 0.2,
    shadowRadius: 7,
    elevation: 5,
  },
});

// Default shadows for backward compatibility
export const SHADOWS = getShadows(false);

// Function to get theme colors
export const getThemeColors = (isDarkMode: boolean) => 
  isDarkMode ? DARK_COLORS : LIGHT_COLORS;

const appTheme = { COLORS, SIZES, FONTS, SHADOWS };

export default appTheme; 