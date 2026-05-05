import { ukrainianCities } from '../data/cities';

/**
 * Повертає локалізовану назву міста.
 * Логіка:
 * - Бібліотечні міста: беремо з nameLocalized[lang]
 * - Worldwide-міста: вже мають правильну назву мовою з API (бо api.js передає lang),
 *   але зберігаємо в city.nameLocalized для незмінності UI при перемиканні мови.
 * - Fallback: city.name (англійський оригінал)
 */
export function getCityName(city, lang) {
  if (!city) return '';
  
  // Якщо є локалізована мапа — беремо з неї
  if (city.nameLocalized && city.nameLocalized[lang]) {
    return city.nameLocalized[lang];
  }
  
  // Інакше — оригінальна назва
  return city.name;
}

/**
 * Чи відповідає місто пошуковому запиту (мультимовно).
 * Шукаємо по всіх мовах, по name, і по ID — щоб юзер міг ввести "Київ" або "Kyiv".
 */
export function cityMatchesQuery(city, query) {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  
  if (city.name.toLowerCase().includes(q)) return true;
  if (city.id.toLowerCase().includes(q)) return true;
  
  if (city.nameLocalized) {
    for (const lang of Object.keys(city.nameLocalized)) {
      if (city.nameLocalized[lang].toLowerCase().includes(q)) return true;
    }
  }
  
  return false;
}