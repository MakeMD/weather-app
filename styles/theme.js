// Централізована тема додатку — дві палітри: light і dark.
// Світлу залишаємо як було, темну будуємо в дусі мінімалізму.

export const lightColors = {
  background: '#F5F1E8',
  text: '#3D3D3D',
  textMuted: '#666',
  textLight: '#888',
  detailsBackground: 'rgba(255, 255, 255, 0.6)',
  cardBackground: 'rgba(255, 255, 255, 0.6)',
  cardBackgroundLight: 'rgba(0, 0, 0, 0.04)',
  divider: 'rgba(0, 0, 0, 0.08)',
  accent: '#4a90e2',
  accentDark: '#3D3D3D',
  warning: '#c8a020',
  error: '#a00',
  errorDark: '#c00',
};

export const darkColors = {
  background: '#1C1A17',           // темно-теплий, з відтінком кави
  text: '#E8E4DB',                 // м'який кремовий — головний текст
  textMuted: '#A6A29B',             // приглушений сірувато-кремовий
  textLight: '#7E7B73',             // ще глуше — для другорядного
  detailsBackground: 'rgba(255, 255, 255, 0.06)', // ледь видимий світлий шар
  cardBackground: 'rgba(255, 255, 255, 0.06)',
  cardBackgroundLight: 'rgba(255, 255, 255, 0.10)', // активний/виділений стан
  divider: 'rgba(255, 255, 255, 0.08)',
  accent: '#7BA9E0',                // м'який блакитний (приглушеніший за світлий)
  accentDark: '#3D3D3D',            // на dark — це світлий "контрастний" замість темного
  warning: '#D4B25A',               // приглушено-теплий жовтий
  error: '#E07A7A',                 // приглушений червоний
  errorDark: '#D66B6B',
};

// Дефолтний експорт для зворотної сумісності — деінде може ще використовуватись
// прямий import { colors } зі старого коду. Поверне світлу палітру.
export const colors = lightColors;

export const fonts = {
  regular: 'Nunito_400Regular',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
};

export const radius = {
  small: 12,
  medium: 14,
  large: 16,
  xlarge: 20,
};