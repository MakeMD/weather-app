import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { ukrainianCities } from '../data/cities';
import { loadUserData, saveUserData } from '../data/storage';
import { findClosestCity } from '../utils/geo';
import { getDeviceLanguage, setLocale } from '../i18n';

function refreshLibraryCities(savedCities) {
  return savedCities.map((saved) => {
    const fromLib = ukrainianCities.find((c) => c.id === saved.id);
    return fromLib ? { ...saved, ...fromLib } : saved;
  });
}

const VALID_THEMES = ['light', 'dark', 'auto'];
const VALID_UNITS = ['metric', 'imperial'];

export function useCityManager() {
  const [userCities, setUserCities] = useState([]);
  const [defaultCityId, setDefaultCityId] = useState(null);
  const [manuallySetDefault, setManuallySetDefault] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [language, setLanguageState] = useState('en');
  const [themePreference, setThemePreferenceState] = useState('auto');
  const [units, setUnitsState] = useState('metric');

  useEffect(() => {
    const init = async () => {
      const stored = await loadUserData();

      const initialLang = stored?.language || getDeviceLanguage();
      setLocale(initialLang);
      setLanguageState(initialLang);

      const storedTheme = stored?.themePreference;
      if (storedTheme && VALID_THEMES.includes(storedTheme)) {
        setThemePreferenceState(storedTheme);
      }

      const storedUnits = stored?.units;
      if (storedUnits && VALID_UNITS.includes(storedUnits)) {
        setUnitsState(storedUnits);
      }

      if (stored?.userCities?.length > 0) {
        const refreshed = refreshLibraryCities(stored.userCities);

        setUserCities(refreshed);
        setDefaultCityId(stored.defaultCityId);
        setManuallySetDefault(stored.manuallySetDefault || false);

        const idx = refreshed.findIndex((c) => c.id === stored.defaultCityId);
        setCurrentIndex(idx >= 0 ? idx : 0);

        if (!stored.manuallySetDefault) {
          updateDefaultViaLocation(refreshed);
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

  // Збереження при будь-яких змінах
  useEffect(() => {
    if (!storageLoaded) return;
    saveUserData({
      userCities,
      defaultCityId,
      manuallySetDefault,
      language,
      themePreference,
      units,
    });
  }, [userCities, defaultCityId, manuallySetDefault, language, themePreference, units, storageLoaded]);

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

  const addManyCities = (newCities) => {
    setUserCities([...userCities, ...newCities]);
  };

  const setLanguage = (code) => {
    setLocale(code);
    setLanguageState(code);
  };

  const setThemePreference = (pref) => {
    if (!VALID_THEMES.includes(pref)) return;
    setThemePreferenceState(pref);
  };

  const setUnits = (u) => {
    if (!VALID_UNITS.includes(u)) return;
    setUnitsState(u);
  };

  const toggleUnits = () => {
    setUnitsState((u) => (u === 'metric' ? 'imperial' : 'metric'));
  };

  return {
    userCities,
    currentIndex,
    currentCity: userCities[currentIndex],
    defaultCityId,
    storageLoaded,
    language,
    themePreference,
    units,
    goToPrevious,
    goToNext,
    setIndex: setCurrentIndex,
    setDefault,
    removeCity,
    addCity,
    addManyCities,
    setLanguage,
    setThemePreference,
    setUnits,
    toggleUnits,
  };
}