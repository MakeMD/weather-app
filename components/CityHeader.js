import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getCityName } from '../utils/cityName';
import { scaleFont } from '../utils/responsive';
import { fonts } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { haptics } from '../utils/haptics';

export default function CityHeader({
  city,
  language,
  isDefault,
  showArrows,
  onPrevious,
  onNext,
  onSettings,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const displayName = getCityName(city, language);

  // Haptic-обгортки: light на стрілках (як snap при свайпі) і на ⚙️ (open settings).
  // Optional chaining гарантує що якщо prop не передано — нічого не падає.
  const handlePrevious = () => {
    haptics.light();
    onPrevious?.();
  };
  const handleNext = () => {
    haptics.light();
    onNext?.();
  };
  const handleSettings = () => {
    haptics.light();
    onSettings?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.left} />

      <View style={styles.center}>
        {showArrows && (
          <TouchableOpacity onPress={handlePrevious} hitSlop={12}>
            <Text style={styles.arrow}>‹</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.name} numberOfLines={1}>
          {displayName} {isDefault && <Text style={styles.pin}>📍</Text>}
        </Text>
        {showArrows && (
          <TouchableOpacity onPress={handleNext} hitSlop={12}>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.right}>
        <TouchableOpacity onPress={handleSettings} hitSlop={12}>
          <Text style={styles.icon}>⚙️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    left: { width: 40 },
    right: { width: 40, alignItems: 'flex-end' },
    center: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    icon: { fontSize: scaleFont(20) },
    arrow: {
      fontSize: scaleFont(28),
      color: colors.text,
      fontFamily: fonts.bold,
      paddingHorizontal: 8,
    },
    name: {
      fontSize: scaleFont(20),
      color: colors.text,
      fontFamily: fonts.extraBold,
      letterSpacing: 1,
    },
    pin: { fontSize: scaleFont(16) },
  });