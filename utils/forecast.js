/**
 * Перетворює 40 точок 3-годинного прогнозу у 5 денних агрегатів.
 * Кожен день містить:
 * - дату (YYYY-MM-DD)
 * - макс/мін температуру за день
 * - "представника" (точка ~12:00 — для іконки і деталей)
 * - максимальну ймовірність опадів за день (pop, 0..1)
 */
export function groupForecastByDay(forecastData) {
  if (!forecastData?.list) return [];

  const byDate = {};

  for (const point of forecastData.list) {
    // dt_txt має формат "2026-05-04 12:00:00"
    const date = point.dt_txt.split(' ')[0];
    if (!byDate[date]) {
      byDate[date] = {
        date,
        points: [],
        tempMax: -Infinity,
        tempMin: Infinity,
        popMax: 0,
        representative: null,
      };
    }
    byDate[date].points.push(point);
    byDate[date].tempMax = Math.max(byDate[date].tempMax, point.main.temp_max);
    byDate[date].tempMin = Math.min(byDate[date].tempMin, point.main.temp_min);
    byDate[date].popMax = Math.max(byDate[date].popMax, point.pop || 0);
  }

  // Для кожного дня знайдемо "представника" — точку найближчу до 12:00
  for (const date of Object.keys(byDate)) {
    const day = byDate[date];
    let best = day.points[0];
    let bestDiff = Infinity;
    for (const p of day.points) {
      const hour = parseInt(p.dt_txt.split(' ')[1].split(':')[0], 10);
      const diff = Math.abs(hour - 12);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = p;
      }
    }
    day.representative = best;
  }

  // Повертаємо у порядку дат
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Дата у форматі YYYY-MM-DD для "сьогодні" (локальний час)
 */
export function getTodayDateString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Повертає короткий ключ дня тижня для дати:
 * 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'
 * Або null, якщо це сьогодні (UI підставить переклад "TODAY")
 */
export function getDayKey(dateString) {
  const today = getTodayDateString();
  if (dateString === today) return null;

  const [yyyy, mm, dd] = dateString.split('-').map(Number);
  const date = new Date(yyyy, mm - 1, dd);

  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[date.getDay()];
}