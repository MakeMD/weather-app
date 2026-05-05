import { t } from '../i18n';

/**
 * Лейбл температури: '°C' для metric, '°F' для imperial.
 * Сам символ ° залишається — тут міняється тільки буква.
 */
export function tempUnitLabel(units) {
  return units === 'imperial' ? '°F' : '°C';
}

/**
 * Лейбл швидкості вітру: 'm/s' для metric, 'mph' для imperial.
 */
export function windUnitLabel(units) {
  return units === 'imperial' ? 'mph' : 'm/s';
}

/**
 * Лейбл видимості: 'km' для metric, 'mi' для imperial.
 * Конвертація значення:
 * - API віддає visibility у метрах для обох units (баг або особливість OWM)
 * - Тому ділимо на 1000 для km і на 1609.34 для mi
 */
export function visUnitLabel(units) {
  return units === 'imperial' ? 'mi' : 'km';
}

/**
 * Конвертує значення видимості з метрів в обрану одиницю.
 * @param visibilityMeters — число з API (в метрах, незалежно від units)
 * @returns округлене число для UI
 */
export function formatVisibility(visibilityMeters, units) {
  if (visibilityMeters == null) return null;
  if (units === 'imperial') {
    return (visibilityMeters / 1609.34).toFixed(0);
  }
  return (visibilityMeters / 1000).toFixed(0);
}