import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchForecast } from '../utils/api';
import { forecastCache } from '../utils/cache';

export function useForecast(cities, currentIndex, language = 'en', units = 'metric', initialMap = null) {
  const [forecastMap, setForecastMap] = useState(() => initialMap || {});

  const forecastMapRef = useRef(forecastMap);
  forecastMapRef.current = forecastMap;

  // Чистимо кеш ТІЛЬКИ при реальній зміні мови (не на першому mount)
  const prevLanguageRef = useRef(language);
  useEffect(() => {
    if (prevLanguageRef.current === language) return;
    prevLanguageRef.current = language;

    let cancelled = false;
    forecastCache.clearLanguage(language).finally(() => {
      if (cancelled) return;
      setForecastMap({});
      forecastMapRef.current = {};
    });
    return () => {
      cancelled = true;
    };
  }, [language]);

  // Чистимо UI-стан при реальній зміні units
  const prevUnitsRef = useRef(units);
  useEffect(() => {
    if (prevUnitsRef.current === units) return;
    prevUnitsRef.current = units;
    setForecastMap({});
    forecastMapRef.current = {};
  }, [units]);

  const loadForecastFor = useCallback(
    async (city, { force = false } = {}) => {
      if (!city) return;

      const cached = await forecastCache.get(language, units, city.id);

      if (cached) {
        setForecastMap((prev) => ({
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
        setForecastMap((prev) => ({
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
        const data = await fetchForecast(city.latitude, city.longitude, language, units);

        await forecastCache.set(language, units, city.id, data);

        setForecastMap((prev) => ({
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
        setForecastMap((prev) => {
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
    const city = cities[currentIndex];
    if (!city) return;

    const inState = forecastMapRef.current[city.id];
    if (inState?.data && !inState.stale && !inState.loading) return;

    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await loadForecastFor(city);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentIndex, cities, loadForecastFor]);

  const getForecastFor = (city) => {
    if (!city) return { data: null, loading: false, error: null };
    return forecastMap[city.id] || { data: null, loading: true, error: null };
  };

  return { getForecastFor };
}