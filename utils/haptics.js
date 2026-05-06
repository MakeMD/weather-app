// utils/haptics.js
//
// Centralized wrapper для expo-haptics:
//   - один import у всьому проєкті
//   - guard на користувацьке вимкнення (через setHapticsEnabled)
//   - catch на API errors (web, старі симулятори — не падати)
//
// Використання:
//   import { haptics } from '../utils/haptics';
//   haptics.light();           // дрібні UI-події
//   haptics.medium();          // значущі дії (refresh trigger)
//   haptics.selection();       // зміна вибору (toggle, picker)
//   haptics.success();         // успішне завершення (місто додано)

import * as Haptics from 'expo-haptics';

// Глобальний прапорець — синхронізується з користувацьким toggle у Settings.
// За замовчуванням увімкнено. Persist шар (AsyncStorage) накручується
// у useCityManager — він викликає setHapticsEnabled при зміні.
let enabled = true;

export function setHapticsEnabled(value) {
  enabled = !!value;
}

export function getHapticsEnabled() {
  return enabled;
}

// Wrapper-функції з guard'ом на enabled і catch на недоступність API.
// Усі API повертають Promise — ми не чекаємо, fire-and-forget.
export const haptics = {
  // Дрібні UI-події: тап, snap до нового міста, кнопка стрілки
  light: () => {
    if (!enabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },

  // Значущі дії: pull-to-refresh, видалити місто
  medium: () => {
    if (!enabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },

  // Сильніший impact — поки не використовується, лишаю для майбутнього
  heavy: () => {
    if (!enabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  },

  // Зміна вибору: toggle °C/°F, picker дня в прогнозі, перемикач теми
  selection: () => {
    if (!enabled) return;
    Haptics.selectionAsync().catch(() => {});
  },

  // Notifications — фінальний фідбек на дію
  success: () => {
    if (!enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  warning: () => {
    if (!enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },
  error: () => {
    if (!enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  },
};