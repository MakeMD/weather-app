import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { scaleFont } from '../utils/responsive';
import { fonts, radius } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { getWeatherIcon } from '../utils/format';
import { t } from '../i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HORIZONTAL_PADDING = SCREEN_WIDTH * 0.1;
const GAP = 6;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING - GAP * 4) / 5;

export default function ForecastCard({ day, dayKey, isSelected, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const isToday = dayKey === null;
  const label = isToday ? t('today') : t(`day_${dayKey}`);
  const icon = getWeatherIcon(day.representative.weather[0].main);
  const popPercent = Math.round((day.popMax || 0) * 100);

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[styles.label, isSelected && styles.labelSelected]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.tempRow}>
        <Text style={styles.tempMax}>{Math.round(day.tempMax)}°</Text>
        <Text style={styles.tempMin}>{Math.round(day.tempMin)}°</Text>
      </View>
      <View style={styles.popRow}>
        <Text style={styles.popDrop}>💧</Text>
        <Text style={styles.popValue}>{popPercent}%</Text>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: radius.medium,
      backgroundColor: colors.cardBackground,
      alignItems: 'center',
      gap: 4,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    cardSelected: {
      borderColor: colors.accentDark,
      backgroundColor: colors.cardBackgroundLight,
    },
    label: {
      fontSize: scaleFont(10),
      color: colors.textLight,
      fontFamily: fonts.bold,
      letterSpacing: 0.3,
    },
    labelSelected: {
      color: colors.text,
      fontFamily: fonts.extraBold,
    },
    icon: {
      fontSize: scaleFont(20),
    },
    tempRow: {
      flexDirection: 'row',
      gap: 3,
      alignItems: 'baseline',
    },
    tempMax: {
      fontSize: scaleFont(13),
      color: colors.text,
      fontFamily: fonts.bold,
    },
    tempMin: {
      fontSize: scaleFont(10),
      color: colors.textLight,
      fontFamily: fonts.regular,
    },
    popRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 1,
    },
    popDrop: {
      fontSize: scaleFont(9),
    },
    popValue: {
      fontSize: scaleFont(9),
      color: colors.textLight,
      fontFamily: fonts.regular,
    },
  });