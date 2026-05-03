import { View, StyleSheet } from 'react-native';
import { Dimensions } from 'react-native';
import WeatherDisplay from './WeatherDisplay';
import CityImage from './CityImage';
import WeatherDetails from './WeatherDetails';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CityScreen({ city, weatherData, loading, error }) {
  return (
    <View style={styles.page}>
      <WeatherDisplay weatherData={weatherData} loading={loading} error={error} />
      <CityImage city={city} />
      {weatherData && !loading && !error && (
        <WeatherDetails weatherData={weatherData} />
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