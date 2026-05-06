// utils/notifications.js
//
// Weather alerts через expo-notifications (LOCAL only — без сервера).
//
// Architecture:
//   1. App.js при mount → setupNotificationHandler() (foreground behavior)
//   2. Користувач у Settings → toggle ON → ensureNotificationsPermission()
//   3. Forecast для default-міста надходить → scheduleTomorrowAlert()
//      → cancellAll → evaluateTomorrow → schedule на 20:00 today (якщо ще не настало)
//
// Чому одна notification на день, не одна-на-кожне-оновлення:
//   cancelAllScheduledNotificationsAsync() перед schedule → reset.
//   Якщо forecast оновився і завтра вже не дощ — стара нотифікація скасовується.
//   Якщо тепер прогнозується сніг — нова з більш точним повідомленням.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { t } from '../i18n';

const ANDROID_CHANNEL_ID = 'weather-alerts';
const NOTIFICATION_HOUR = 20; // 20:00 local — типовий evening reminder час

// Пороги для extended conditions. Залежать від units!
//   wind: m/s (metric) → 14 м/с ≈ 50 км/год = "сильний"
//   wind: mph (imperial) → 31 mph ≈ 50 км/год
//   heat: 35°C / 95°F = небезпечна спека
//   cold: -15°C / 5°F = екстремальний холод
const THRESHOLDS = {
  metric:   { wind: 14,  heat: 35, cold: -15 },
  imperial: { wind: 31,  heat: 95, cold: 5   },
};

// Foreground behavior. Викликається ОДИН раз при старті додатка з App.js.
// Без нього сповіщення в foreground не показуються (тихо ігноруються).
export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      // Нові API (SDK 54+):
      shouldShowBanner: true,
      shouldShowList: true,
      // Backward compat для старіших SDK:
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Android channel — обов'язково на Android 8+. Без channel'а нотифікації
// silently dropped (без помилки, без логу).
async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Weather alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3D3D3D',
    });
  } catch (e) {
    console.log('[notifications] setupAndroidChannel error:', e);
  }
}

// Запит дозволу + setup channel (idempotent — можна викликати багато разів).
// Returns: 'granted' | 'denied' | 'undetermined'
//
// iOS нюанс: якщо користувач один раз denied — попросити повторно НЕ можна.
// Треба йти в системні Settings вручну. Це обмеження ОС, не нашого коду.
export async function ensureNotificationsPermission() {
  await setupAndroidChannel();

  const { status: current } = await Notifications.getPermissionsAsync();
  if (current === 'granted') return 'granted';
  if (current === 'denied') return 'denied';

  const { status: result } = await Notifications.requestPermissionsAsync();
  return result;
}

// Перевірка статусу без запиту. Для App.js: перевіряти на mount чи
// користувач не вимкнув permission в системних Settings поки додаток
// був закритий.
export async function getNotificationsPermissionStatus() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch {
    return 'undetermined';
  }
}

// Оцінює завтрашню погоду з масиву OWM forecast.list.
// Returns: 'thunder' | 'snow' | 'rain' | 'wind' | 'heat' | 'cold' | null
//
// Priority order — найсильніше попередження виграє:
// thunder > snow > rain > wind > heat > cold
function evaluateTomorrow(forecastList, units) {
  if (!forecastList?.length) return null;

  // Завтрашня доба в локальному часі пристрою
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const start = new Date(tomorrow);
  start.setHours(0, 0, 0, 0);
  const end = new Date(tomorrow);
  end.setHours(23, 59, 59, 999);

  const items = forecastList.filter((item) => {
    const dt = new Date(item.dt * 1000);
    return dt >= start && dt <= end;
  });

  if (!items.length) return null;

  let hasThunder = false;
  let hasSnow = false;
  let hasRain = false;
  let maxWind = 0;
  let maxTemp = -Infinity;
  let minTemp = Infinity;

  for (const item of items) {
    const main = item.weather?.[0]?.main;
    if (main === 'Thunderstorm') hasThunder = true;
    else if (main === 'Snow') hasSnow = true;
    else if (main === 'Rain' || main === 'Drizzle') hasRain = true;

    const wind = item.wind?.speed ?? 0;
    if (wind > maxWind) maxWind = wind;

    const tMax = item.main?.temp_max ?? item.main?.temp ?? -Infinity;
    const tMin = item.main?.temp_min ?? item.main?.temp ?? Infinity;
    if (tMax > maxTemp) maxTemp = tMax;
    if (tMin < minTemp) minTemp = tMin;
  }

  const thr = THRESHOLDS[units] || THRESHOLDS.metric;

  if (hasThunder) return 'thunder';
  if (hasSnow) return 'snow';
  if (hasRain) return 'rain';
  if (maxWind >= thr.wind) return 'wind';
  if (maxTemp >= thr.heat) return 'heat';
  if (minTemp <= thr.cold) return 'cold';
  return null;
}

// Повертає Date для today 20:00 у локальному часі, або null якщо вже минуло.
//
// Чому "null якщо минуло": якщо ми відкриваємо додаток о 21:00, не хочемо
// fire-immediately notification (це буде раптово і не корисно — користувач
// і так уже бачить forecast в додатку). Завтра при відкритті — заплануємо.
function getTriggerDate() {
 const now = new Date();
 const target = new Date();
 target.setHours(NOTIFICATION_HOUR, 0, 0, 0);
 return target > now ? target : null;
 
}

// Cancel всіх раніше запланованих weather alerts.
// Можна викликати ізольовано (при toggle OFF) або як префікс перед reschedule.
export async function cancelWeatherAlerts() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.log('[notifications] cancel error:', e);
  }
}

// Головна публічна функція. Викликається з App.js при отриманні forecast.
//
// Args:
//   forecast — об'єкт OWM /forecast (має .list масив)
//   cityName — локалізована назва міста (для body)
//   units — 'metric' | 'imperial'
//
// Returns: 'scheduled' | 'no_severe_weather' | 'too_late' | 'no_permission'
export async function scheduleTomorrowAlert(forecast, cityName, units) {
  const permission = await ensureNotificationsPermission();
  if (permission !== 'granted') return 'no_permission';

  // Завжди cancel попередні — погода могла змінитись, тип може бути іншим
  await cancelWeatherAlerts();

  const condition = evaluateTomorrow(forecast?.list, units);
  if (!condition) return 'no_severe_weather';

  const triggerDate = getTriggerDate();
  if (!triggerDate) return 'too_late';

  const title = t(`notif_${condition}_title`);
  const body = t(`notif_${condition}_body`, { city: cityName });

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: { type: 'weather_alert', condition },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
      },
    });
    return 'scheduled';
  } catch (e) {
    console.log('[notifications] schedule error:', e);
    return 'no_permission';
  }
}