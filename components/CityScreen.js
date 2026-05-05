import { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import WeatherDisplay from './WeatherDisplay';
import CityImage from './CityImage';
import WeatherDetails from './WeatherDetails';
import WeatherAnimation from './WeatherAnimation';
import ForecastList from './ForecastList';
import SunMinMaxRow from './SunMinMaxRow';
import { isDayTime } from '../utils/format';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  useEffect(() => {
    setSelectedDay(null);
  }, [city.id]);

  const currentMain = weatherData?.weather?.[0]?.main;
  const selectedDate = selectedDay ? selectedDay.date : null;

  const handleSelectDay = (day) => {
    if (selectedDay && selectedDay.date === day.date) {
      setSelectedDay(null);
    } else {
      setSelectedDay(day);
    }
  };

  return (
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
          isDay={isDayTime(weatherData)}
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
  );
}

const styles = StyleSheet.create({
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: '5%',
    gap: 12,
  },
});