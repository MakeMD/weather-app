// utils/weatherPalette.js
// Палітри під типи погоди — тонкі тональні зсуви в межах теплого беж-сімейства
// (light) або глибокого темно-кавового (dark). Використовується в CityScreen
// для підкрутки bg + accent (зокрема колір кривої HourlyChart).

const PALETTES = {
  light: {
    clearDay:     { bg: '#F5F1E8', curve: '#D08247' }, // поточний — теплий кремовий
    clearNight:   { bg: '#E5DFCE', curve: '#7A6D55' }, // приглушений вечірній
    cloudy:       { bg: '#E5E2D9', curve: '#9C8B73' }, // нейтральний перлинний
    rain:         { bg: '#D6DAD4', curve: '#7A8B82' }, // прохолодний шавлієвий
    snow:         { bg: '#ECEEE9', curve: '#9DA9AC' }, // холодний майже-білий
    thunderstorm: { bg: '#A89C82', curve: '#3D362C' }, // драматичний оливковий
    fog:          { bg: '#DEDDD7', curve: '#A09787' }, // туманний нейтральний
  },
  dark: {
    clearDay:     { bg: '#1C1A17', curve: '#E8A66B' }, // поточний dark + теплий accent
    clearNight:   { bg: '#161412', curve: '#7A8AB5' }, // глибша ніч + холодний акцент
    cloudy:       { bg: '#1F1D1A', curve: '#A89A82' },
    rain:         { bg: '#181D1B', curve: '#9CADA5' },
    snow:         { bg: '#1A1D1B', curve: '#B8C0BD' },
    thunderstorm: { bg: '#0F0D0B', curve: '#E0AB60' }, // найглибша + бурштиновий бзик
    fog:          { bg: '#1B1916', curve: '#A89A82' },
  },
};

// OWM weather.main → ключ палітри
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

// Повертає { bg, curve } для поточної погоди + теми
export function getWeatherPalette(weatherMain, isDay, isDark = false) {
  const key = paletteKey(weatherMain, isDay);
  return PALETTES[isDark ? 'dark' : 'light'][key];
}