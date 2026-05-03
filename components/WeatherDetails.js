import { View, Text, StyleSheet } from 'react-native';
import { scaleFont } from '../utils/responsive';
import { colors, fonts, radius } from '../styles/theme';

export default function WeatherDetails({ weatherData }) {
  if (!weatherData) return null;

  return (
    <View style={styles.detailsContainer}>
      <DetailItem
        emoji="🌡️"
        value={`${Math.round(weatherData.main.feels_like)}°`}
        label="Feels"
      />
      <DetailItem
        emoji="💧"
        value={`${weatherData.main.humidity}%`}
        label="Humidity"
      />
      <DetailItem
        emoji="💨"
        value={Math.round(weatherData.wind.speed)}
        label="Wind m/s"
      />
      <DetailItem
        emoji="👁️"
        value={(weatherData.visibility / 1000).toFixed(0)}
        label="Vis km"
      />
    </View>
  );
}

function DetailItem({ emoji, value, label }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailEmoji}>{emoji}</Text>
      <Text style={styles.detailValue}>{value}</Text>
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  detailsContainer: {
    width: '100%',
    backgroundColor: colors.detailsBackground,
    borderRadius: radius.xlarge,
    paddingVertical: '3.5%',
    paddingHorizontal: '2%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailItem: { alignItems: 'center', flex: 1 },
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