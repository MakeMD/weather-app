import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scaleFont } from '../utils/responsive';
import { fonts, radius } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { getSunriseSunset, formatTimeInTimezone } from '../utils/sun';
import { tempUnitLabel } from '../utils/units';
import { t } from '../i18n';

export default function SunMinMaxRow({ city, weatherData, forecastDay, units }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!weatherData && !forecastDay) return null;

  // Часова зона з weather (вона однакова для міста, не залежить від дня)
  const tzOffset = weatherData?.timezone || 0;

  // Sunrise/Sunset
  let sunrise, sunset;

  if (forecastDay) {
    // Для обраного дня прогнозу — рахуємо власноруч
    const times = getSunriseSunset(forecastDay.date, city.latitude, city.longitude);
    sunrise = times.sunrise;
    sunset = times.sunset;
  } else if (weatherData?.sys?.sunrise && weatherData?.sys?.sunset) {
    // Для today — беремо з API
    sunrise = new Date(weatherData.sys.sunrise * 1000);
    sunset = new Date(weatherData.sys.sunset * 1000);
  }

  const sunriseStr = sunrise ? formatTimeInTimezone(sunrise, tzOffset) : null;
  const sunsetStr = sunset ? formatTimeInTimezone(sunset, tzOffset) : null;

  // High / Low
  let high, low;
  const tempUnit = tempUnitLabel(units);

  if (forecastDay) {
    high = Math.round(forecastDay.tempMax);
    low = Math.round(forecastDay.tempMin);
  } else if (weatherData?.main) {
    // Для today — беремо temp_max і temp_min з поточної погоди
    // (це не "за день", але кращого не маємо без forecast)
    high = Math.round(weatherData.main.temp_max);
    low = Math.round(weatherData.main.temp_min);
  }

  return (
    <View style={styles.row}>
      {sunriseStr && sunsetStr && (
        <View style={styles.cluster}>
          <Text style={styles.value}>🌅 {sunriseStr}</Text>
          <Text style={styles.divider}>·</Text>
          <Text style={styles.value}>🌇 {sunsetStr}</Text>
        </View>
      )}

      {high != null && low != null && (
        <View style={styles.cluster}>
          <Text style={styles.value}>↑{high}{tempUnit}</Text>
          <Text style={styles.divider}>·</Text>
          <Text style={styles.value}>↓{low}{tempUnit}</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.cardBackground,
      borderRadius: radius.medium,
      gap: 8,
    },
    cluster: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    value: {
      fontSize: scaleFont(13),
      color: colors.text,
      fontFamily: fonts.bold,
    },
    divider: {
      fontSize: scaleFont(13),
      color: colors.textLight,
      fontFamily: fonts.regular,
    },
  });