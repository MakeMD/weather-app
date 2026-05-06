// utils/weatherPalette.js
// Палітри під типи погоди — фон, крива HourlyChart, і tints для анімацій.
// Кожна (theme, weather) пара має свої tints inline.
//
// Спеціальний випадок — clearNight: оскільки на рівні App.js ми ФОРСИМО
// dark тему коли видиме місто = ніч, light.clearNight тепер дублює
// dark.clearNight (bg темний). Це гарантує що навіть якщо хтось викличе
// палітру в light contexті — фон узгоджується з решта UI у dark mode.

const PALETTES = {
  light: {
    clearDay: {
      bg: '#F5F1E8',
      curve: '#D08247',
      sun: '#FFD27A',
    },
    clearNight: {
      // Темний bg — UI всеодно буде у dark mode (App.js override)
      bg: '#161412',
      curve: '#7A8AB5',
      moon: '#E8E4D5',
    },
    cloudy: {
      bg: '#E5E2D9',
      curve: '#9C8B73',
      cloud: '#9A8F7E',
    },
    rain: {
      bg: '#D6DAD4',
      curve: '#7A8B82',
      cloud: '#6B6258',
      rainDrop: '#9FB0BF',
    },
    snow: {
      bg: '#ECEEE9',
      curve: '#9DA9AC',
    },
    thunderstorm: {
      bg: '#A89C82',
      curve: '#3D362C',
      cloud: '#4A4339',
      rainDrop: '#9FB0BF',
    },
    fog: {
      bg: '#DEDDD7',
      curve: '#A09787',
      fog: '#C8C4BC',
    },
  },
  dark: {
    clearDay: {
      bg: '#1C1A17',
      curve: '#E8A66B',
      sun: '#FFD27A',
    },
    clearNight: {
      bg: '#161412',
      curve: '#7A8AB5',
      moon: '#E8E4D5',
    },
    cloudy: {
      bg: '#1F1D1A',
      curve: '#A89A82',
      cloud: '#9A8F7E',
    },
    rain: {
      bg: '#181D1B',
      curve: '#9CADA5',
      cloud: '#6B6258',
      rainDrop: '#9FB0BF',
    },
    snow: {
      bg: '#1A1D1B',
      curve: '#B8C0BD',
    },
    thunderstorm: {
      bg: '#0F0D0B',
      curve: '#E0AB60',
      cloud: '#4A4339',
      rainDrop: '#9FB0BF',
    },
    fog: {
      bg: '#1B1916',
      curve: '#A89A82',
      fog: '#C8C4BC',
    },
  },
};

function paletteKey(weatherMain, isDay) {
  switch (weatherMain) {
    case 'Clear':
      return isDay ? 'clearDay' : 'clearNight';
    case 'Clouds':
      return 'cloudy';
    case 'Rain':
    case 'Drizzle':
      return 'rain';
    case 'Snow':
      return 'snow';
    case 'Thunderstorm':
      return 'thunderstorm';
    case 'Mist':
    case 'Fog':
    case 'Haze':
    case 'Smoke':
    case 'Dust':
    case 'Sand':
    case 'Ash':
    case 'Squall':
    case 'Tornado':
      return 'fog';
    default:
      return 'clearDay';
  }
}

export function getWeatherPalette(weatherMain, isDay, isDark = false) {
  const key = paletteKey(weatherMain, isDay);
  return PALETTES[isDark ? 'dark' : 'light'][key];
}