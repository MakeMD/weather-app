import { t } from '../i18n';

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

const MONTH_KEYS = [
  'month_jan', 'month_feb', 'month_mar', 'month_apr',
  'month_may', 'month_jun', 'month_jul', 'month_aug',
  'month_sep', 'month_oct', 'month_nov', 'month_dec',
];

const DAY_SHORT_KEYS = [
  'dayShort_sun', 'dayShort_mon', 'dayShort_tue', 'dayShort_wed',
  'dayShort_thu', 'dayShort_fri', 'dayShort_sat',
];

/**
 * Локалізована дата для довільного Date.
 * Формат: "Нд, 3 трав, 2026" / "Sun, May 3, 2026"
 */
export const formatDateLocalized = (date) => {
  const dayShort = t(DAY_SHORT_KEYS[date.getDay()]);
  const monthShort = t(MONTH_KEYS[date.getMonth()]);
  const day = date.getDate();
  const year = date.getFullYear();
  return `${dayShort}, ${day} ${monthShort}, ${year}`;
};

/**
 * Сьогоднішня дата у локалізованому форматі.
 * Приймає опціональний language параметр — потрібен щоб React перерендерив
 * компоненти при зміні мови (саме значення параметра не використовується,
 * але присутність змінної у пропсах змушує перерахувати рядок).
 */
// eslint-disable-next-line no-unused-vars
export const getTodayFormatted = (_language) => formatDateLocalized(new Date());

/**
 * Локалізує дату прогнозу YYYY-MM-DD → "Пн, 5 трав, 2026"
 */
// eslint-disable-next-line no-unused-vars
export const formatForecastDateLocalized = (dateString, _language) => {
  const [yyyy, mm, dd] = dateString.split('-').map(Number);
  return formatDateLocalized(new Date(yyyy, mm - 1, dd));
};

export function isDayTime(weatherData) {
  if (!weatherData?.sys?.sunrise || !weatherData?.sys?.sunset) {
    return true; // fallback на день, якщо даних немає
  }
  const now = Date.now() / 1000;
  return now > weatherData.sys.sunrise && now < weatherData.sys.sunset;
}