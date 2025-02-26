import { TextStyle } from 'react-native';

/**
 * Creates a type-safe font style by ensuring fontWeight is a valid value
 * This helps prevent TypeScript errors with fontWeight values from theme files
 * 
 * @param fontOrWeight The font style object from the theme or a font weight string
 * @param size Optional font size (when first parameter is a weight string)
 * @returns A TextStyle object with valid fontWeight
 */
export const createFontStyle = (fontOrWeight: any, size?: number): TextStyle => {
  // Handle case where two parameters are provided (weight and size)
  if (typeof fontOrWeight === 'string' && size !== undefined) {
    const style: TextStyle = {
      fontWeight: fontOrWeight,
      fontSize: size,
    };
    
    // Ensure fontWeight is a valid value
    if (['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'].includes(fontOrWeight)) {
      style.fontWeight = fontOrWeight as TextStyle['fontWeight'];
    } else {
      // Default to 'normal' if not a valid value
      style.fontWeight = 'normal';
    }
    
    return style;
  }
  
  // Handle case where a single font object is provided
  const style: TextStyle = { ...fontOrWeight };
  if (style.fontWeight && typeof style.fontWeight === 'string') {
    // Ensure fontWeight is a valid value
    // Valid values include: 'normal', 'bold', '100', '200', etc.
    if (['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'].includes(style.fontWeight)) {
      style.fontWeight = style.fontWeight as TextStyle['fontWeight'];
    } else {
      // Default to 'normal' if not a valid value
      style.fontWeight = 'normal';
    }
  }
  return style;
}; 