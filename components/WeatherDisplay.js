import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { scaleFont } from '../utils/responsive';
import { colors, fonts } from '../styles/theme';
import { getWeatherIcon, getTodayFormatted } from '../utils/format';

export default function WeatherDisplay({ weatherData, loading, error }) {
  const today = getTodayFormatted();

  if (loading) {
    return (
      <View style={styles.weatherBlock}>
        <ActivityIndicator size="large" color={colors.text} />
        <Text style={styles.date}>{today}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.weatherBlock}>
        <Text style={styles.weatherIcon}>⚠️</Text>
        <Text style={styles.errorText}>Не вдалось завантажити</Text>
      </View>
    );
  }

  return (
    <View style={styles.weatherBlock}>
      <Text style={styles.weatherIcon}>
        {getWeatherIcon(weatherData.weather[0].main)}
      </Text>
      <Text style={styles.date}>{today}</Text>
      <Text style={styles.temperature}>{Math.round(weatherData.main.temp)}°C</Text>
      <Text style={styles.description} numberOfLines={1}>
        {weatherData.weather[0].description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  weatherBlock: { alignItems: 'center', gap: 4 },
  weatherIcon: { fontSize: scaleFont(48) },
  date: {
    fontSize: scaleFont(14),
    color: colors.textMuted,
    fontFamily: fonts.regular,
  },
  temperature: {
    fontSize: scaleFont(34),
    color: colors.text,
    fontFamily: fonts.bold,
  },
  description: {
    fontSize: scaleFont(14),
    color: colors.textMuted,
    fontFamily: fonts.regular,
    textTransform: 'capitalize',
  },
  errorText: {
    fontSize: scaleFont(14),
    color: colors.error,
    fontFamily: fonts.bold,
  },
});