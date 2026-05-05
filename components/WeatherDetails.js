import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scaleFont } from '../utils/responsive';
import { fonts, radius } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { windUnitLabel, visUnitLabel, formatVisibility } from '../utils/units';
import { t } from '../i18n';

export default function WeatherDetails({ weatherData, forecastDay, units = 'metric' }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const source = forecastDay
    ? {
        feels: forecastDay.representative.main.feels_like,
        humidity: forecastDay.representative.main.humidity,
        wind: forecastDay.representative.wind.speed,
        visibility: forecastDay.representative.visibility,
      }
    : weatherData
    ? {
        feels: weatherData.main.feels_like,
        humidity: weatherData.main.humidity,
        wind: weatherData.wind.speed,
        visibility: weatherData.visibility,
      }
    : null;

  if (!source) return null;

  const visConverted = formatVisibility(source.visibility, units);
  const visValue = visConverted != null ? visConverted : '—';

  return (
    <View style={styles.detailsContainer}>
      <DetailItem
        emoji="🌡️"
        value={`${Math.round(source.feels)}°`}
        label={t('feels')}
        styles={styles}
      />
      <DetailItem
        emoji="💧"
        value={`${source.humidity}%`}
        label={t('humidity')}
        styles={styles}
      />
      <DetailItem
        emoji="💨"
        value={Math.round(source.wind)}
        label={`${t('wind')} ${windUnitLabel(units)}`}
        styles={styles}
      />
      <DetailItem
        emoji="👁️"
        value={visValue}
        label={`${t('visibility')} ${visUnitLabel(units)}`}
        styles={styles}
      />
    </View>
  );
}

function DetailItem({ emoji, value, label, styles }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailEmoji}>{emoji}</Text>
      <Text style={styles.detailValue}>{value}</Text>
      <Text style={styles.detailLabel} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    detailsContainer: {
      width: '100%',
      backgroundColor: colors.detailsBackground,
      borderRadius: radius.xlarge,
      paddingVertical: '3.5%',
      paddingHorizontal: '2%',
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    detailItem: { alignItems: 'center', flex: 1, paddingHorizontal: 2 },
    detailEmoji: { fontSize: scaleFont(22), marginBottom: 4 },
    detailValue: {
      fontSize: scaleFont(18),
      color: colors.text,
      fontFamily: fonts.bold,
      marginBottom: 2,
    },
    detailLabel: {
      fontSize: scaleFont(10),
      color: colors.textLight,
      fontFamily: fonts.regular,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      textAlign: 'center',
    },
  });