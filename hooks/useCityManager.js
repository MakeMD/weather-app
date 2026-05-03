import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { ukrainianCities } from '../data/cities';
import { loadUserData, saveUserData } from '../data/storage';
import { findClosestCity } from '../utils/geo';

export function useCityManager() {
  const [userCities, setUserCities] = useState([]);
  const [defaultCityId, setDefaultCityId] = useState(null);
  const [manuallySetDefault, setManuallySetDefault] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [storageLoaded, setStorageLoaded] = useState(false);

  // ── Початкове завантаження ──
  useEffect(() => {
    const init = async () => {
      const stored = await loadUserData();

      if (stored?.userCities?.length > 0) {
        setUserCities(stored.userCities);
        setDefaultCityId(stored.defaultCityId);
        setManuallySetDefault(stored.manuallySetDefault || false);

        const idx = stored.userCities.findIndex((c) => c.id === stored.defaultCityId);
        setCurrentIndex(idx >= 0 ? idx : 0);

        if (!stored.manuallySetDefault) {
          updateDefaultViaLocation(stored.userCities);
        }
      } else {
        await firstLaunchSetup();
      }

      setStorageLoaded(true);
    };
    init();
  }, []);

  const firstLaunchSetup = async () => {
    let initialCity = ukrainianCities.find((c) => c.id === 'kyiv');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const closest = findClosestCity(
          location.coords.latitude,
          location.coords.longitude,
          ukrainianCities,
        );
        if (closest) initialCity = closest;
      }
    } catch (e) {
      console.log('First launch geo error:', e);
    }

    setUserCities([initialCity]);
    setDefaultCityId(initialCity.id);
    setCurrentIndex(0);
  };

  const updateDefaultViaLocation = async (cities) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const closest = findClosestCity(
        location.coords.latitude,
        location.coords.longitude,
        cities,
      );
      if (closest) {
        setDefaultCityId(closest.id);
        const idx = cities.findIndex((c) => c.id === closest.id);
        if (idx >= 0) setCurrentIndex(idx);
      }
    } catch (e) {
      console.log('Update geo error:', e);
    }
  };

  // ── Збереження при будь-яких змінах ──
  useEffect(() => {
    if (!storageLoaded) return;
    saveUserData({ userCities, defaultCityId, manuallySetDefault });
  }, [userCities, defaultCityId, manuallySetDefault, storageLoaded]);

  // ── Дії ──
  const goToPrevious = () => {
    setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : userCities.length - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex < userCities.length - 1 ? currentIndex + 1 : 0);
  };

  const setDefault = (id) => {
    setDefaultCityId(id);
    setManuallySetDefault(true);
    const idx = userCities.findIndex((c) => c.id === id);
    if (idx >= 0) setCurrentIndex(idx);
  };

  const removeCity = (id) => {
    const newList = userCities.filter((c) => c.id !== id);
    setUserCities(newList);

    const currentCity = userCities[currentIndex];
    if (currentCity?.id === id) {
      const idx = newList.findIndex((c) => c.id === defaultCityId);
      setCurrentIndex(idx >= 0 ? idx : 0);
    } else {
      const newIdx = newList.findIndex((c) => c.id === currentCity?.id);
      setCurrentIndex(newIdx >= 0 ? newIdx : 0);
    }
  };

  const addCity = (newCity) => {
    setUserCities([...userCities, newCity]);
  };

  return {
    userCities,
    currentIndex,
    currentCity: userCities[currentIndex],
    defaultCityId,
    storageLoaded,
    goToPrevious,
    goToNext,
    setIndex: setCurrentIndex,
    setDefault,
    removeCity,
    addCity,
  };
}