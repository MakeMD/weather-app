import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
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
import { haptics } from './utils/haptics';
import {
  setupNotificationHandler,
  scheduleTomorrowAlert,
  cancelWeatherAlerts,
  getNotificationsPermissionStatus,
} from './utils/notifications';
import { getCityName } from './utils/cityName';
import { lightColors, darkColors } from './styles/theme';
import CityHeader from './components/CityHeader';
import CityScreen from './components/CityScreen';
import SettingsModal from './components/SettingsModal';
import AddCityModal from './components/AddCityModal';
import LanguageModal from './components/LanguageModal';
import ThemeModal from './components/ThemeModal';
import { FogVeil } from './components/animations/FogAnimation';
import { ThemeProvider, useTheme, ThemeContext } from './contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

SplashScreen.preventAutoHideAsync().catch(() => {});

// ⬇️ Викликається ОДИН раз при завантаженні модуля. Конфігурує foreground
// behavior для notifications — без цього якщо нотифікація прийде поки додаток
// відкритий, користувач її не побачить.
setupNotificationHandler();

const MIN_SPLASH_DURATION_MS = 1500;
const MODAL_TRANSITION_MS = 300;

const ATMOSPHERIC_WEATHER = [
  'Mist', 'Fog', 'Haze', 'Smoke', 'Dust', 'Sand', 'Ash', 'Squall', 'Tornado',
];

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
  const baseTheme = useTheme();
  const baseScheme = baseTheme.scheme;
  const baseIsDark = baseScheme === 'dark';

  const [showSettings, setShowSettings] = useState(false);
  const [showAddCity, setShowAddCity] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showTheme, setShowTheme] = useState(false);

  const flatListRef = useRef(null);

  const scrollX = useRef(
    new Animated.Value(cm.currentIndex * SCREEN_WIDTH)
  ).current;

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

  const handleRefresh = useCallback(() => {
    haptics.medium();
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (flatListRef.current && cm.userCities.length > 0) {
      flatListRef.current.scrollToIndex({
        index: cm.currentIndex,
        animated: true,
      });
    }
  }, [cm.currentIndex, cm.userCities.length]);

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
      haptics.light();
      cm.setIndex(newIndex);
    }
  };

  // renderItem для горизонтального FlatList. Передаємо в CityScreen
  // refreshing+onRefresh — на iOS вони увімкнуть pull-to-refresh у внутрішньому
  // ScrollView CityScreen; на Android просто проігноруються (там оновлення
  // через кнопку ↻ у CityHeader).
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
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    );
  };

  const isSingleCity = cm.userCities.length === 1;
  const currentWeather = getWeatherFor(cm.currentCity);
  const currentForecast = getForecastFor(cm.currentCity);

  const displayedCity = cm.userCities[displayedIndex] ?? cm.currentCity;
  const displayedWeather = getWeatherFor(displayedCity);
  const isDefault = displayedCity.id === cm.defaultCityId;
  const displayedMain = displayedWeather.data?.weather?.[0]?.main;
  const displayedIsDay = isDayTime(displayedWeather.data);

  const isNightOverride = baseScheme !== 'dark' && !displayedIsDay && !!displayedWeather.data;
  const effectiveIsDark = baseIsDark || isNightOverride;

  const effectiveTheme = useMemo(() => {
    if (!isNightOverride) return baseTheme;
    return {
      colors: darkColors,
      scheme: 'dark',
      preference: baseTheme.preference,
    };
  }, [isNightOverride, baseTheme]);

  const colors = effectiveTheme.colors;
  const scheme = effectiveTheme.scheme;
  const styles = useMemo(() => createStyles(colors), [colors]);

  const palette = getWeatherPalette(displayedMain, displayedIsDay, effectiveIsDark);
  const isAtmospheric = !!displayedMain && ATMOSPHERIC_WEATHER.includes(displayedMain);

  const paletteBgs = cm.userCities.map((c) => {
    const w = getWeatherFor(c);
    const m = w.data?.weather?.[0]?.main;
    const d = isDayTime(w.data);
    const cityUseDark = baseIsDark || (!d && !!w.data);
    return getWeatherPalette(m, d, cityUseDark).bg;
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

  // ============================================================
  // 🔔 WEATHER NOTIFICATIONS — scheduling logic
  // ============================================================
  // Логіка: коли forecast для DEFAULT-міста готовий і користувач увімкнув
  // notifications → плануємо tomorrow alert на 20:00.
  //
  // Триггери re-schedule:
  //   - notificationsEnabled toggled
  //   - default city change
  //   - language/units change (for content)
  //   - forecast refresh (через fingerprint)
  //
  // Коли notificationsEnabled=false → cancel all scheduled.

  const defaultCity = useMemo(
    () => cm.userCities.find((c) => c.id === cm.defaultCityId),
    [cm.userCities, cm.defaultCityId]
  );

  const defaultForecast = defaultCity ? getForecastFor(defaultCity) : null;

  // Fingerprint для виявлення оновлень forecast — використовуємо timestamp
  // першого item'а (змінюється при кожному реальному refresh).
  const defaultForecastFp = defaultForecast?.data?.list?.[0]?.dt ?? null;

  // Reschedule при зміні preference / forecast / units / language
  useEffect(() => {
    if (!cm.notificationsEnabled) return;
    if (!defaultCity) return;
    if (!defaultForecast?.data?.list?.length) return;

    const cityName = getCityName(defaultCity, cm.language);
    scheduleTomorrowAlert(defaultForecast.data, cityName, cm.units)
      .then((result) => {
        console.log('[notifications]', result, 'for', defaultCity.id);
      })
      .catch((e) => console.log('[notifications] error', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cm.notificationsEnabled,
    cm.defaultCityId,
    cm.language,
    cm.units,
    defaultForecastFp,
  ]);

  // Cancel при вимкненні toggle
  useEffect(() => {
    if (!cm.notificationsEnabled) {
      cancelWeatherAlerts();
    }
  }, [cm.notificationsEnabled]);

  // На mount: якщо notificationsEnabled=true, але користувач відкликав
  // permission в системних Settings поки додаток був закритий — виявляємо
  // це і автоматично вимикаємо toggle. Без цього UI брехав би.
  useEffect(() => {
    if (!cm.notificationsEnabled) return;
    let cancelled = false;
    (async () => {
      const status = await getNotificationsPermissionStatus();
      if (cancelled) return;
      if (status !== 'granted') {
        cm.setNotificationsEnabled(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeContext.Provider value={effectiveTheme}>
      <AnimatedSafeAreaView
        style={[styles.safeArea, { backgroundColor: safeAreaBg }]}
        edges={['top', 'bottom', 'left', 'right']}
      >
        {/* Атмосферний шар (між SafeArea bg і UI) */}
        {isAtmospheric && <FogVeil color={palette.fog} />}

        <View style={styles.headerContainer}>
          <CityHeader
            city={displayedCity}
            language={cm.language}
            isDefault={isDefault}
            onSettings={() => setShowSettings(true)}
            // ⬇️ Refresh-стан + колбек. На Android CityHeader рендерить
            // кнопку ↻ (умова всередині), на iOS просто ігнорує (бо там
            // pull-to-refresh у внутрішньому ScrollView CityScreen).
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        </View>

        {/*
          ⚠️ ВАЖЛИВЕ архітектурне рішення (з чекпоінту #7):
          RefreshControl ТУТ більше не використовується НА ЖОДНІЙ платформі.
          На Android він конфліктував з peek HourlyChart (SwipeRefreshLayout
          ловив жест закриття peek як refresh). На iOS — переїхав у
          внутрішній ScrollView CityScreen, де працює коректно з peek.

          Якщо колись захочеться повернути pull-to-refresh у горизонтальний
          FlatList — треба пам'ятати про цей баг. Краще не повертати.
        */}
        {isSingleCity ? (
          <ScrollView
            contentContainerStyle={styles.singleCityContent}
            showsVerticalScrollIndicator={false}
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
              refreshing={refreshing}
              onRefresh={handleRefresh}
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
          hapticsEnabled={cm.hapticsEnabled}
          onToggleHaptics={cm.toggleHaptics}
          // ⬇️ нові пропси для weather alerts
          notificationsEnabled={cm.notificationsEnabled}
          onSetNotifications={cm.setNotificationsEnabled}
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
    </ThemeContext.Provider>
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