import SunCalc from 'suncalc';

/**
 * Повертає sunrise і sunset для довільної дати і координат.
 * Використовує таймзону міста з API (offset у секундах від UTC).
 *
 * @param dateInput — Date об'єкт або YYYY-MM-DD рядок
 * @param latitude
 * @param longitude
 * @param timezoneOffset — секунди від UTC (наприклад, +10800 для Києва влітку)
 * @returns { sunrise: Date, sunset: Date } у "глобальному" UTC-часі
 *          (для відображення в UI використовуй formatTimeInTimezone)
 */
export function getSunriseSunset(dateInput, latitude, longitude) {
  let date;
  if (typeof dateInput === 'string') {
    // YYYY-MM-DD → Date об'єкт у полудень UTC цього дня (щоб не зачепити денні перегини)
    const [yyyy, mm, dd] = dateInput.split('-').map(Number);
    date = new Date(Date.UTC(yyyy, mm - 1, dd, 12, 0, 0));
  } else {
    date = dateInput;
  }

  const times = SunCalc.getTimes(date, latitude, longitude);
  return {
    sunrise: times.sunrise,
    sunset: times.sunset,
  };
}

/**
 * Форматує Date у часі міста (з урахуванням timezoneOffset).
 * 24-годинний формат: "5:42", "19:30".
 */
export function formatTimeInTimezone(date, timezoneOffsetSec) {
  if (!date || isNaN(date.getTime())) return '—';

  // Беремо UTC-мс і додаємо offset → отримуємо "локальний" час міста
  const localMs = date.getTime() + (timezoneOffsetSec || 0) * 1000;
  const localDate = new Date(localMs);

  // getUTCHours/Minutes тепер дасть час так, як у місті
  const h = localDate.getUTCHours();
  const m = String(localDate.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}