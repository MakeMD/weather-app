import { useState, useEffect, useCallback } from 'react';
import { fetchCurrentWeather } from '../utils/api';

export function useWeather(city) {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Винесли логіку завантаження в окрему функцію, щоб мати змогу викликати її
  // як при першому показі (через useEffect), так і при pull-to-refresh.
  const load = useCallback(
    async (isRefresh = false) => {
      if (!city) return;
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);
        const data = await fetchCurrentWeather(city.latitude, city.longitude);
        setWeatherData(data);
      } catch (err) {
        setError(err.message);
        if (!isRefresh) {
          // При pull-to-refresh лишаємо старі дані, щоб користувач не втратив контекст
          setWeatherData(null);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [city?.id]
  );

  // Завантаження при зміні міста
  useEffect(() => {
    load(false);
  }, [load]);

  // Цю функцію викличемо при тягненні вниз
  const refresh = () => load(true);

  return { weatherData, loading, error, refreshing, refresh };
}