import { Dimensions } from 'react-native';

export const SCREEN_WIDTH = Dimensions.get('window').width;
export const SCREEN_HEIGHT = Dimensions.get('window').height;

// Адаптивний шрифт від ширини екрану з обмеженнями min/max
export const scaleFont = (size) => {
  const scale = SCREEN_WIDTH / 390;
  const newSize = size * scale;
  return Math.max(size * 0.85, Math.min(newSize, size * 1.3));
};

// Адаптивний вертикальний розмір від висоти екрану з обмеженнями min/max.
// Reference — iPhone 13 (844pt). Корисно для висот плашок, peek-ів, відступів,
// які мають проґаратись пропорційно екрану.
export const scaleHeight = (size) => {
  const scale = SCREEN_HEIGHT / 844;
  const newSize = size * scale;
  return Math.max(size * 0.85, Math.min(newSize, size * 1.3));
};