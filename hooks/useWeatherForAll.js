import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchCurrentWeather } from '../utils/api';
import { weatherCache } from '../utils/cache';

export function useWeatherForAll(cities, currentIndex, language = 'en', units = 'metric', initialMap = null) {
  const [weatherMap, setWeatherMap] = useState(() => initialMap || {});
  const [refreshing, setRefreshing] = useState(false);

  const weatherMapRef = useRef(weatherMap);
  weatherMapRef.current = weatherMap;

  // Чистимо кеш ТІЛЬКИ при реальній зміні мови (не на першому mount)
  const prevLanguageRef = useRef(language);
  useEffect(() => {
    if (prevLanguageRef.current === language) return;
    prevLanguageRef.current = language;

    let cancelled = false;
    weatherCache.clearLanguage(language).finally(() => {
      if (cancelled) return;
      setWeatherMap({});
      weatherMapRef.current = {};
    });
    return () => {
      cancelled = true;
    };
  }, [language]);

  // Чистимо UI-стан при реальній зміні units (не на першому mount)
  const prevUnitsRef = useRef(units);
  useEffect(() => {
    if (prevUnitsRef.current === units) return;
    prevUnitsRef.current = units;
    setWeatherMap({});
    weatherMapRef.current = {};
  }, [units]);

  const loadWeatherFor = useCallback(
    async (city, { force = false } = {}) => {
      if (!city) return;

      const cached = await weatherCache.get(language, units, city.id);

      if (cached) {
        setWeatherMap((prev) => ({
          ...prev,
          [city.id]: {
            data: cached.data,
            fetchedAt: cached.fetchedAt,
            loading: !cached.fresh,
            error: null,
            stale: !cached.fresh,
          },
        }));

        if (cached.fresh && !force) return;
      } else {
        setWeatherMap((prev) => ({
          ...prev,
          [city.id]: {
            data: null,
            loading: true,
            error: null,
            stale: false,
          },
        }));
      }

      try {
        const data = await fetchCurrentWeather(city.latitude, city.longitude, language, units);

        await weatherCache.set(language, units, city.id, data);

        setWeatherMap((prev) => ({
          ...prev,
          [city.id]: {
            data,
            loading: false,
            error: null,
            fetchedAt: Date.now(),
            stale: false,
          },
        }));
      } catch (err) {
        setWeatherMap((prev) => {
          const existing = prev[city.id];
          return {
            ...prev,
            [city.id]: {
              data: existing?.data || null,
              loading: false,
              error: err.message,
              fetchedAt: existing?.fetchedAt,
              stale: !!existing?.data,
            },
          };
        });
      }
    },
    [language, units]
  );

  useEffect(() => {
    if (!cities.length) return;

    const indicesToLoad = [currentIndex];
    if (cities.length > 1) {
      indicesToLoad.push(
        (currentIndex + 1) % cities.length,
        (currentIndex - 1 + cities.length) % cities.length
      );
    }

    let cancelled = false;

    (async () => {
      for (const idx of indicesToLoad) {
        if (cancelled) return;
        const city = cities[idx];
        if (!city) continue;

        const inState = weatherMapRef.current[city.id];
        if (inState?.data && !inState.stale && !inState.loading) continue;

        await loadWeatherFor(city);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentIndex, cities, loadWeatherFor]);

  const refresh = async () => {
    const city = cities[currentIndex];
    if (!city) return;
    setRefreshing(true);
    await loadWeatherFor(city, { force: true });
    setRefreshing(false);
  };

  const getWeatherFor = (city) => {
    if (!city) return { data: null, loading: false, error: null };
    return weatherMap[city.id] || { data: null, loading: true, error: null };
  };

  return { getWeatherFor, refresh, refreshing };
}