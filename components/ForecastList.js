import { useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import ForecastCard from './ForecastCard';
import { groupForecastByDay, getDayKey } from '../utils/forecast';
import { useTheme } from '../contexts/ThemeContext';

export default function ForecastList({ forecastData, loading, selectedDate, onSelectDay }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(), []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={colors.text} />
      </View>
    );
  }

  if (!forecastData) return null;

  const days = groupForecastByDay(forecastData);
  if (days.length === 0) return null;

  const visibleDays = days.slice(0, 5);

  return (
    <View style={styles.list}>
      {visibleDays.map((day) => {
        const dayKey = getDayKey(day.date);
        const isSelected = day.date === selectedDate;
        return (
          <ForecastCard
            key={day.date}
            day={day}
            dayKey={dayKey}
            isSelected={isSelected}
            onPress={() => onSelectDay(day)}
          />
        );
      })}
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    loading: {
      height: 90,
      justifyContent: 'center',
      alignItems: 'center',
    },
    list: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 6,
      paddingVertical: 4,
    },
  });