import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';

import en from './en.json';
import uk from './uk.json';
import pl from './pl.json';
import de from './de.json';
import es from './es.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

const i18n = new I18n({ en, uk, pl, de, es });
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export function getDeviceLanguage() {
  try {
    const locales = getLocales();
    const code = locales[0]?.languageCode?.toLowerCase();
    if (SUPPORTED_LANGUAGES.some((l) => l.code === code)) {
      return code;
    }
  } catch (e) {
    console.log('Locale detection error:', e);
  }
  return 'en';
}

export function setLocale(code) {
  i18n.locale = code;
}

export function t(key, options) {
  return i18n.t(key, options);
}

/**
 * Локалізована плюралізація.
 * - Слов'янські мови (uk, pl): 3 форми — one / few / many
 * - Англійська, німецька, іспанська: 2 форми — one / other
 *
 * Повертає назву суфікса для ключа: "one", "few", "many", "other"
 */
function getPluralForm(count, locale) {
  if (locale === 'uk' || locale === 'pl') {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return 'one';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'few';
    return 'many';
  }
  return count === 1 ? 'one' : 'other';
}

/**
 * Спеціальний t() для лічильників:
 * tPlural('addNCities', 3) → "Додати 3 міста" (ua) / "Add 3 cities" (en)
 *
 * Шукає ключ виду "addNCities_one", "addNCities_few", "addNCities_many", "addNCities_other"
 */
export function tPlural(key, count, options) {
  const form = getPluralForm(count, i18n.locale);
  const fullKey = `${key}_${form}`;
  return i18n.t(fullKey, { ...options, count });
}

export default i18n;