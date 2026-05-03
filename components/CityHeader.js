import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { scaleFont } from '../utils/responsive';
import { colors, fonts } from '../styles/theme';

export default function CityHeader({ cityName, isDefault, showArrows, onPrevious, onNext, onSettings }) {
  return (
    <View style={styles.header}>
      <View style={styles.cityNavGroup}>
        {showArrows && (
          <TouchableOpacity onPress={onPrevious} hitSlop={20}>
            <Text style={styles.arrow}>‹</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.city} numberOfLines={1} adjustsFontSizeToFit>
          {cityName}
        </Text>

        {isDefault && <Text style={styles.locationPin}>📍</Text>}

        {showArrows && (
          <TouchableOpacity onPress={onNext} hitSlop={20}>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity onPress={onSettings} hitSlop={15} style={styles.settingsButton}>
        <Text style={styles.settingsIcon}>⚙️</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 50,
  },
  cityNavGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
  },
  arrow: {
    fontSize: scaleFont(38),
    color: colors.text,
    fontFamily: fonts.bold,
    lineHeight: scaleFont(44),
  },
  city: {
    fontSize: scaleFont(26),
    color: colors.text,
    fontFamily: fonts.extraBold,
    letterSpacing: 2,
    flexShrink: 1,
  },
  locationPin: { fontSize: scaleFont(16) },
  settingsButton: {
    position: 'absolute',
    right: 0,
    padding: 4,
  },
  settingsIcon: { fontSize: scaleFont(22) },
});