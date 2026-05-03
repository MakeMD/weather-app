// Код країни (UA, PL, US) → прапор-emoji (🇺🇦, 🇵🇱, 🇺🇸)
export const countryCodeToFlag = (code) => {
  if (!code || code.length !== 2) return '🌍';
  return code.toUpperCase().replace(/./g, (c) =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  );
};

// "New York" → "new_york", використовується для генерації id
export const slugify = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

// Код погоди OpenWeatherMap → emoji
export const getWeatherIcon = (main) => {
  const icons = {
    Clear: '☀️',
    Clouds: '☁️',
    Rain: '🌧️',
    Drizzle: '🌦️',
    Thunderstorm: '⛈️',
    Snow: '❄️',
    Mist: '🌫️',
    Fog: '🌫️',
    Haze: '🌫️',
  };
  return icons[main] || '🌤️';
};

// Сьогоднішня дата у форматі "May 2, 2026"
export const getTodayFormatted = () =>
  new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });