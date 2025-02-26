import React, { createContext, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setDarkMode } from '../store/slices/themeSlice';
import { getThemeColors, getShadows } from '../constants/theme';

// Create a context for theme values
export const ThemeContext = createContext({
  isDarkMode: false,
  colors: getThemeColors(false),
  shadows: getShadows(false),
});

// Hook to use theme values
export const useTheme = () => useContext(ThemeContext);

// ThemeProvider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const { isDarkMode } = useSelector((state: RootState) => state.theme);
  const systemColorScheme = useColorScheme();

  // Initialize theme based on system preference (only on first load)
  useEffect(() => {
    // Only set if system preference is dark and we haven't explicitly set a preference
    if (systemColorScheme === 'dark') {
      dispatch(setDarkMode(true));
    }
  }, []);

  // Get theme colors and shadows based on current mode
  const colors = getThemeColors(isDarkMode);
  const shadows = getShadows(isDarkMode);

  // Provide theme values to children
  return (
    <ThemeContext.Provider value={{ isDarkMode, colors, shadows }}>
      {children}
    </ThemeContext.Provider>
  );
}; 