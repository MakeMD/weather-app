import { useState, useRef, useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import * as SplashScreen from 'expo-splash-screen';
import { useCityManager } from './hooks/useCityManager';
import { useWeatherForAll } from './hooks/useWeatherForAll';
import { useForecast } from './hooks/useForecast';
import { weatherCache, forecastCache } from './utils/cache';
import { isDayTime } from './utils/format';
import { getWeatherPalette } from './utils/weatherPalette';
import CityHeader from './components/CityHeader';
import CityScreen from './components/CityScreen';
import SettingsModal from './components/SettingsModal';
import AddCityModal from './components/AddCityModal';
import LanguageModal from './components/LanguageModal';
import ThemeModal from './components/ThemeModal';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// SafeAreaView з підтримкою animated styles — щоб inline-bg плавно інтерполювався
const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

SplashScreen.preventAutoHideAsync().catch(() => {});

const MIN_SPLASH_DURATION_MS = 1500;
const MODAL_TRANSITION_MS = 300;

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
        loading: !entry.fresh,
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

  // scrollX тепер ініціалізується з поточної позиції — щоб FlatList з
  // initialScrollIndex не "стрибнув" по кольорах від 0 до cm.currentIndex.
  const scrollX = useRef(
    new Animated.Value(cm.currentIndex * SCREEN_WIDTH)
  ).current;

  // displayedIndex — який індекс зараз "візуально активний" (>50% видимий).
  // Оновлюється під час свайпу через scrollX listener — header перемикається
  // на нову назву міста тоді ж, коли фон проходить через 50% інтерполяції.
  const [displayedIndex, setDisplayedIndex] = useState(cm.currentIndex);
  const lastDisplayedIndexRef = useRef(cm.currentIndex);

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

  // Listener: коли scrollX переходить через половину до сусіднього міста,
  // оновлюємо displayedIndex (і header вмить отримує нову назву).
  useEffect(() => {
    if (cm.userCities.length < 2) return;

    const id = scrollX.addListener(({ value }) => {
      const newIdx = Math.round(value / SCREEN_WIDTH);
      if (
        newIdx !== lastDisplayedIndexRef.current &&
        newIdx >= 0 &&
        newIdx < cm.userCities.length
      ) {
        lastDisplayedIndexRef.current = newIdx;
        setDisplayedIndex(newIdx);
      }
    });
    return () => scrollX.removeListener(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cm.userCities.length]);

  // Failsafe: якщо displayedIndex став нерелевантним після add/remove міста.
  useEffect(() => {
    if (displayedIndex >= cm.userCities.length) {
      const safe = Math.max(0, cm.userCities.length - 1);
      setDisplayedIndex(safe);
      lastDisplayedIndexRef.current = safe;
    }
  }, [cm.userCities.length, displayedIndex]);

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

  // "Візуально активне" місто — для header і fallback-палітри.
  // Оновлюється real-time при свайпі.
  const displayedCity = cm.userCities[displayedIndex] ?? cm.currentCity;
  const displayedWeather = getWeatherFor(displayedCity);
  const isDefault = displayedCity.id === cm.defaultCityId;

  const isDark = scheme === 'dark';
  const displayedMain = displayedWeather.data?.weather?.[0]?.main;
  const displayedIsDay = isDayTime(displayedWeather.data);
  const palette = getWeatherPalette(displayedMain, displayedIsDay, isDark);

  // bg-кольори для всіх міст — для інтерполяції під час свайпу.
  const paletteBgs = cm.userCities.map((c) => {
    const w = getWeatherFor(c);
    const m = w.data?.weather?.[0]?.main;
    const d = isDayTime(w.data);
    return getWeatherPalette(m, d, isDark).bg;
  });
  const paletteBgsKey = paletteBgs.join('|');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const interpolatedBg = useMemo(() => {
    if (paletteBgs.length < 2) return null;
    return scrollX.interpolate({
      inputRange: paletteBgs.map((_, i) => i * SCREEN_WIDTH),
      outputRange: paletteBgs,
      extrapolate: 'clamp',
    });
  }, [paletteBgsKey]);

  const safeAreaBg = isSingleCity ? palette.bg : (interpolatedBg ?? palette.bg);

  return (
    <AnimatedSafeAreaView
      style={[styles.safeArea, { backgroundColor: safeAreaBg }]}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <View style={styles.headerContainer}>
        <CityHeader
          city={displayedCity}
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
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
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
    </AnimatedSafeAreaView>
  );
}

function AppShell() {
  const [splashReady, setSplashReady] = useState(false);
  const [hydrated, setHydrated] = useState(null);
  const startTimeRef = useRef(Date.now());

  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  const cm = useCityManager();

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
    safeArea: { flex: 1 },
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