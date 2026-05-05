import { useState, useRef, useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, FlatList, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import * as SplashScreen from 'expo-splash-screen';
import { useCityManager } from './hooks/useCityManager';
import { useWeatherForAll } from './hooks/useWeatherForAll';
import { useForecast } from './hooks/useForecast';
import { weatherCache, forecastCache } from './utils/cache';
import CityHeader from './components/CityHeader';
import CityScreen from './components/CityScreen';
import SettingsModal from './components/SettingsModal';
import AddCityModal from './components/AddCityModal';
import LanguageModal from './components/LanguageModal';
import ThemeModal from './components/ThemeModal';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

SplashScreen.preventAutoHideAsync().catch(() => {});

const MIN_SPLASH_DURATION_MS = 1500;
const MODAL_TRANSITION_MS = 300;

/**
 * Завантажити кешовану погоду і прогноз для всіх міст з диску паралельно.
 * Повертає { weatherInitial, forecastInitial } у форматі для useWeatherForAll/useForecast.
 */
async function hydrateCaches(cities, language, units) {
  if (!cities?.length) return { weatherInitial: {}, forecastInitial: {} };

  const cityIds = cities.map((c) => c.id);

  const [weatherEntries, forecastEntries] = await Promise.all([
    weatherCache.bulkGet(language, units, cityIds),
    forecastCache.bulkGet(language, units, cityIds),
  ]);
  const toMap = (entries) => {
    const result = {};
    for (const [id, entry] of entries) {
      result[id] = {
        data: entry.data,
        fetchedAt: entry.fetchedAt,
        loading: !entry.fresh, // якщо stale — UI ще покажемо ефект перевірки
        error: null,
        stale: !entry.fresh,
      };
    }
    return result;
  };

  return {
    weatherInitial: toMap(weatherEntries),
    forecastInitial: toMap(forecastEntries),
  };
}

function WeatherAppInner({ cm, weatherInitial, forecastInitial }) {
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [showSettings, setShowSettings] = useState(false);
  const [showAddCity, setShowAddCity] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showTheme, setShowTheme] = useState(false);

  const flatListRef = useRef(null);

  const { getWeatherFor, refresh, refreshing } = useWeatherForAll(
    cm.userCities,
    cm.currentIndex,
    cm.language,
    cm.units,
    weatherInitial
  );
  const { getForecastFor } = useForecast(
    cm.userCities,
    cm.currentIndex,
    cm.language,
    cm.units,
    forecastInitial
  );

  useEffect(() => {
    if (flatListRef.current && cm.userCities.length > 0) {
      flatListRef.current.scrollToIndex({
        index: cm.currentIndex,
        animated: true,
      });
    }
  }, [cm.currentIndex, cm.userCities.length]);

  const handleAddPress = () => {
    setShowSettings(false);
    setTimeout(() => setShowAddCity(true), MODAL_TRANSITION_MS);
  };

  const handleAddCityClose = () => {
    setShowAddCity(false);
    setTimeout(() => setShowSettings(true), MODAL_TRANSITION_MS);
  };

  const handleLanguagePress = () => {
    setShowSettings(false);
    setTimeout(() => setShowLanguage(true), MODAL_TRANSITION_MS);
  };

  const handleLanguageClose = () => {
    setShowLanguage(false);
    setTimeout(() => setShowSettings(true), MODAL_TRANSITION_MS);
  };

  const handleThemePress = () => {
    setShowSettings(false);
    setTimeout(() => setShowTheme(true), MODAL_TRANSITION_MS);
  };

  const handleThemeClose = () => {
    setShowTheme(false);
    setTimeout(() => setShowSettings(true), MODAL_TRANSITION_MS);
  };

  const onMomentumScrollEnd = (e) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (newIndex !== cm.currentIndex && newIndex >= 0 && newIndex < cm.userCities.length) {
      cm.setIndex(newIndex);
    }
  };

  const renderItem = ({ item }) => {
    const { data, loading, error } = getWeatherFor(item);
    const forecast = getForecastFor(item);
    return (
      <CityScreen
        city={item}
        language={cm.language}
        units={cm.units}
        weatherData={data}
        loading={loading}
        error={error}
        forecastData={forecast.data}
        forecastLoading={forecast.loading}
      />
    );
  };

  const isSingleCity = cm.userCities.length === 1;
  const currentWeather = getWeatherFor(cm.currentCity);
  const currentForecast = getForecastFor(cm.currentCity);
  const isDefault = cm.currentCity.id === cm.defaultCityId;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.headerContainer}>
        <CityHeader
          city={cm.currentCity}
          language={cm.language}
          isDefault={isDefault}
          showArrows={!isSingleCity}
          onPrevious={cm.goToPrevious}
          onNext={cm.goToNext}
          onSettings={() => setShowSettings(true)}
        />
      </View>

      {isSingleCity ? (
        <ScrollView
          contentContainerStyle={styles.singleCityContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.text} />
          }
        >
          <CityScreen
            city={cm.currentCity}
            language={cm.language}
            units={cm.units}
            weatherData={currentWeather.data}
            loading={currentWeather.loading}
            error={currentWeather.error}
            forecastData={currentForecast.data}
            forecastLoading={currentForecast.loading}
          />
        </ScrollView>
      ) : (
        <FlatList
          ref={flatListRef}
          data={cm.userCities}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
          initialScrollIndex={cm.currentIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.text} />
          }
        />
      )}

      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

      <SettingsModal
        visible={showSettings}
        language={cm.language}
        themePreference={cm.themePreference}
        units={cm.units}
        onClose={() => setShowSettings(false)}
        userCities={cm.userCities}
        defaultCityId={cm.defaultCityId}
        onSetDefault={cm.setDefault}
        onRemove={cm.removeCity}
        onAddPress={handleAddPress}
        onLanguagePress={handleLanguagePress}
        onThemePress={handleThemePress}
        onToggleUnits={cm.toggleUnits}
      />

      <AddCityModal
        visible={showAddCity}
        language={cm.language}
        onClose={handleAddCityClose}
        userCities={cm.userCities}
        onAddMany={cm.addManyCities}
      />

      <LanguageModal
        visible={showLanguage}
        currentLanguage={cm.language}
        onClose={handleLanguageClose}
        onSelectLanguage={cm.setLanguage}
      />

      <ThemeModal
        visible={showTheme}
        currentPreference={cm.themePreference}
        onClose={handleThemeClose}
        onSelectTheme={cm.setThemePreference}
      />
    </SafeAreaView>
  );
}

function AppShell() {
  const [splashReady, setSplashReady] = useState(false);
  const [hydrated, setHydrated] = useState(null); // { weatherInitial, forecastInitial } | null
  const startTimeRef = useRef(Date.now());

  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  const cm = useCityManager();

  // Гідруємо кеш одразу як storageLoaded і у нас є userCities
  useEffect(() => {
    if (!cm.storageLoaded || !cm.userCities.length || hydrated) return;

    let cancelled = false;
    (async () => {
      const result = await hydrateCaches(cm.userCities, cm.language, cm.units);
      if (cancelled) return;
      setHydrated(result);
    })();

    return () => {
      cancelled = true;
    };
  }, [cm.storageLoaded, cm.userCities, cm.language, cm.units, hydrated]);

  useEffect(() => {
    const allReady =
      fontsLoaded &&
      cm.storageLoaded &&
      !!cm.currentCity &&
      hydrated !== null;
    if (!allReady) return;

    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, MIN_SPLASH_DURATION_MS - elapsed);

    const timer = setTimeout(async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        // ignore
      }
      setSplashReady(true);
    }, remaining);

    return () => clearTimeout(timer);
  }, [fontsLoaded, cm.storageLoaded, cm.currentCity, hydrated]);

  if (!splashReady) {
    return null;
  }

  return (
    <ThemeProvider preference={cm.themePreference}>
      <WeatherAppInner
        cm={cm}
        weatherInitial={hydrated.weatherInitial}
        forecastInitial={hydrated.forecastInitial}
      />
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppShell />
    </SafeAreaProvider>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    headerContainer: {
      paddingHorizontal: '5%',
      paddingTop: '2%',
      paddingBottom: 8,
    },
    singleCityContent: {
      flexGrow: 1,
      paddingBottom: '2%',
    },
  });