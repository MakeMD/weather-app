import { useState, useEffect, useCallback } from 'react';
import { fetchCurrentWeather } from '../utils/api';

export function useWeatherForAll(cities, currentIndex) {
  // weatherMap: { cityId: { data, loading, error } }
  const [weatherMap, setWeatherMap] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const loadWeatherFor = useCallback(async (city, isRefresh = false) => {
    if (!city) return;

    setWeatherMap((prev) => ({
      ...prev,
      [city.id]: {
        ...(prev[city.id] || {}),
        loading: !isRefresh,
        error: null,
      },
    }));

    try {
      const data = await fetchCurrentWeather(city.latitude, city.longitude);
      setWeatherMap((prev) => ({
        ...prev,
        [city.id]: { data, loading: false, error: null },
      }));
    } catch (err) {
      setWeatherMap((prev) => ({
        ...prev,
        [city.id]: {
          data: prev[city.id]?.data || null,
          loading: false,
          error: err.message,
        },
      }));
    }
  }, []);

  // Завантажуємо поточне місто та сусідів (для плавного свайпу)
  useEffect(() => {
    if (!cities.length) return;

    const indicesToLoad = [currentIndex];
    if (cities.length > 1) {
      indicesToLoad.push(
        (currentIndex + 1) % cities.length,
        (currentIndex - 1 + cities.length) % cities.length
      );
    }

    for (const idx of indicesToLoad) {
      const city = cities[idx];
      // Не перевантажуємо, якщо вже є свіжі дані
      if (city && !weatherMap[city.id]?.data) {
        loadWeatherFor(city);
      }
    }
  }, [currentIndex, cities, loadWeatherFor]);

  // Pull-to-refresh для поточного міста
  const refresh = async () => {
    const city = cities[currentIndex];
    if (!city) return;
    setRefreshing(true);
    await loadWeatherFor(city, true);
    setRefreshing(false);
  };

  // Допоміжна функція: повертає стан погоди для конкретного міста
  const getWeatherFor = (city) => {
    if (!city) return { data: null, loading: false, error: null };
    return weatherMap[city.id] || { data: null, loading: true, error: null };
  };

  return { getWeatherFor, refresh, refreshing };
}