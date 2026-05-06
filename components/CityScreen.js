import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import WeatherDisplay from './WeatherDisplay';
import CityImage from './CityImage';
import WeatherDetails from './WeatherDetails';
import WeatherAnimation from './WeatherAnimation';
import ForecastList from './ForecastList';
import SunMinMaxRow from './SunMinMaxRow';
import HourlyChart from './HourlyChart';
import { isDayTime } from '../utils/format';
import { useTheme } from '../contexts/ThemeContext';
import { darkColors, layout } from '../styles/theme';
import { getWeatherPalette } from '../utils/weatherPalette';

const { width: SCREEN_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

// Висота "верхньої сторінки" — все, крім самої плашки чарту.
// Решта простору внизу = layout.hourlyPeek, де визирає шапка плашки.
const PAGE_HEIGHT = WINDOW_HEIGHT - layout.safeAreaOffset - layout.hourlyPeek;

export default function CityScreen({
  city,
  weatherData,
  loading,
  error,
  language,
  units,
  forecastData,
  forecastLoading,
}) {
  const [selectedDay, setSelectedDay] = useState(null);
  const { colors } = useTheme();

  useEffect(() => {
    setSelectedDay(null);
  }, [city.id]);

  const currentMain = weatherData?.weather?.[0]?.main;
  const selectedDate = selectedDay ? selectedDay.date : null;

  // Палітра потрібна локально для curveColor у HourlyChart
  // (фон сцени вже встановлюється на App-level через SafeArea bg).
  const isDark = colors.background === darkColors.background;
  const isDay = isDayTime(weatherData);
  const palette = getWeatherPalette(currentMain, isDay, isDark);

  const handleSelectDay = (day) => {
    if (selectedDay && selectedDay.date === day.date) {
      setSelectedDay(null);
    } else {
      setSelectedDay(day);
    }
  };

  const showHourlyChart =
    weatherData &&
    !loading &&
    !error &&
    forecastData?.list?.length >= 7;

  return (
    // ⚠️ ScrollView навмисно БЕЗ backgroundColor — щоб FogVeil
    // (атмосферний шар на App-level) був видно крізь нього.
    // SafeArea bg в App.js дає правильний колір через інтерполяцію
    // при свайпі між містами.
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.page}>
        <WeatherDisplay
          weatherData={weatherData}
          loading={loading}
          error={error}
          forecastDay={selectedDay}
          language={language}
          units={units}
        />

        <View style={{ flex: 1 }}>
          <CityImage city={city} />
          <WeatherAnimation
            weatherMain={currentMain}
            isDay={isDay}
            palette={palette}
          />
        </View>

        {weatherData && !loading && !error && (
          <WeatherDetails
            weatherData={weatherData}
            forecastDay={selectedDay}
            units={units}
          />
        )}

        {weatherData && !loading && !error && (
          <SunMinMaxRow
            city={city}
            weatherData={weatherData}
            forecastDay={selectedDay}
            units={units}
          />
        )}

        {weatherData && !loading && !error && (
          <ForecastList
            forecastData={forecastData}
            loading={forecastLoading}
            selectedDate={selectedDate}
            onSelectDay={handleSelectDay}
          />
        )}
      </View>

      {showHourlyChart && (
        <View style={styles.hourlyWrap}>
          <HourlyChart
            current={weatherData}
            forecast={forecastData.list}
            curveColor={palette.curve}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: SCREEN_WIDTH,
    // backgroundColor НЕ виставляємо — лишаємо прозорим.
  },
  page: {
    height: PAGE_HEIGHT,
    paddingHorizontal: '5%',
    paddingVertical: layout.pagePaddingVertical,
    gap: 12,
  },
  hourlyWrap: {
    paddingHorizontal: '5%',
    paddingBottom: 24,
  },
});