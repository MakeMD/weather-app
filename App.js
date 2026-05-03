import { useState, useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  View, ActivityIndicator, StyleSheet, FlatList,
  ScrollView, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';

import { useCityManager } from './hooks/useCityManager';
import { useWeatherForAll } from './hooks/useWeatherForAll';

import CityHeader from './components/CityHeader';
import CityScreen from './components/CityScreen';
import SettingsModal from './components/SettingsModal';
import AddCityModal from './components/AddCityModal';

import { colors } from './styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function WeatherApp() {
  const [showSettings, setShowSettings] = useState(false);
  const [showAddCity, setShowAddCity] = useState(false);

  const flatListRef = useRef(null);

  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  const cm = useCityManager();
  const { getWeatherFor, refresh, refreshing } = useWeatherForAll(
    cm.userCities,
    cm.currentIndex
  );

  // Синхронізація: коли currentIndex змінюється ззовні (стрілки, set as default) — прокручуємо FlatList
  useEffect(() => {
    if (flatListRef.current && cm.userCities.length > 0) {
      flatListRef.current.scrollToIndex({
        index: cm.currentIndex,
        animated: true,
      });
    }
  }, [cm.currentIndex, cm.userCities.length]);

  if (!fontsLoaded || !cm.storageLoaded || !cm.currentCity) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  const handleAddPress = () => {
    setShowSettings(false);
    setTimeout(() => setShowAddCity(true), 300);
  };

  const handleAddCityClose = () => {
    setShowAddCity(false);
    setTimeout(() => setShowSettings(true), 300);
  };

  const handleAddCity = (newCity) => {
    cm.addCity(newCity);
    handleAddCityClose();
  };

  // Коли користувач свайпає — оновлюємо currentIndex
  const onMomentumScrollEnd = (e) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (newIndex !== cm.currentIndex && newIndex >= 0 && newIndex < cm.userCities.length) {
      cm.setIndex(newIndex);
    }
  };

  const renderItem = ({ item }) => {
    const { data, loading, error } = getWeatherFor(item);
    return (
      <CityScreen
        city={item}
        weatherData={data}
        loading={loading}
        error={error}
      />
    );
  };

  // Якщо одне місто — рендеримо без FlatList (нема сенсу і pull-to-refresh працює надійніше)
  const isSingleCity = cm.userCities.length === 1;
  const currentWeather = getWeatherFor(cm.currentCity);
  const isDefault = cm.currentCity.id === cm.defaultCityId;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.headerContainer}>
        <CityHeader
          cityName={cm.currentCity.name}
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
            weatherData={currentWeather.data}
            loading={currentWeather.loading}
            error={currentWeather.error}
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

      <StatusBar style="dark" />

      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        userCities={cm.userCities}
        defaultCityId={cm.defaultCityId}
        onSetDefault={cm.setDefault}
        onRemove={cm.removeCity}
        onAddPress={handleAddPress}
      />

      <AddCityModal
        visible={showAddCity}
        onClose={handleAddCityClose}
        userCities={cm.userCities}
        onAdd={handleAddCity}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <WeatherApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
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
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});