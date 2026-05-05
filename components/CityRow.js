import { useMemo } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getCityImage } from '../data/cityImages';
import { scaleFont } from '../utils/responsive';
import { fonts, radius } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

export default function CityRow({ city, rightSlot, disabled, onPress, subtitle }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const image = getCityImage(city);

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.row, disabled && styles.rowDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.thumb}>
        <Image
          source={image}
          style={styles.thumbImage}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{city.name}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {rightSlot}
    </Container>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.cardBackground,
      borderRadius: radius.medium,
      padding: 12,
      marginBottom: 8,
    },
    rowDisabled: { opacity: 0.4 },
    thumb: {
      width: 56,
      height: 56,
      borderRadius: radius.small,
      backgroundColor: colors.cardBackgroundLight,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    thumbImage: { width: '100%', height: '100%' },
    info: { flex: 1, gap: 2 },
    name: {
      fontSize: scaleFont(16),
      color: colors.text,
      fontFamily: fonts.bold,
      letterSpacing: 1,
    },
    subtitle: {
      fontSize: scaleFont(12),
      color: colors.textLight,
      fontFamily: fonts.regular,
    },
  });