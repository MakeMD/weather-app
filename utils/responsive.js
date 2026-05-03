import { Dimensions } from 'react-native';

export const SCREEN_WIDTH = Dimensions.get('window').width;

// Адаптивний шрифт від ширини екрану з обмеженнями min/max
export const scaleFont = (size) => {
  const scale = SCREEN_WIDTH / 390;
  const newSize = size * scale;
  return Math.max(size * 0.85, Math.min(newSize, size * 1.3));
};