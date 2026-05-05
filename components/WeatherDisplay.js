import { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { scaleFont } from '../utils/responsive';
import { fonts } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { getWeatherIcon, getTodayFormatted, formatForecastDateLocalized } from '../utils/format';
import { tempUnitLabel } from '../utils/units';
import { t } from '../i18n';

export default function WeatherDisplay({ weatherData, loading, error, forecastDay, language, units = 'metric' }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const today = getTodayFormatted(language);
  const tempUnit = tempUnitLabel(units);

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
        <Text style={styles.errorText}>{t('errorLoadWeather')}</Text>
      </View>
    );
  }

  if (!weatherData) return null;

  const isForecast = !!forecastDay;
  const main = isForecast
    ? forecastDay.representative.weather[0].main
    : weatherData.weather[0].main;
  const description = isForecast
    ? forecastDay.representative.weather[0].description
    : weatherData.weather[0].description;
  const temperature = isForecast
    ? Math.round(forecastDay.tempMax)
    : Math.round(weatherData.main.temp);
  const dateLabel = isForecast
    ? formatForecastDateLocalized(forecastDay.date, language)
    : today;

  return (
    <View style={styles.weatherBlock}>
      <Text style={styles.weatherIcon}>{getWeatherIcon(main)}</Text>
      <Text style={styles.date}>{dateLabel}</Text>
      <Text style={styles.temperature}>{temperature}{tempUnit}</Text>
      <Text style={styles.description} numberOfLines={1}>
        {description}
      </Text>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
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