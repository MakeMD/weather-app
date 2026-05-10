import { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { getCityName } from '../utils/cityName';
import { scaleFont } from '../utils/responsive';
import { fonts } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { haptics } from '../utils/haptics';

// На Android рендеримо кнопку "оновити" біля ⚙️.
// На iOS її НЕ показуємо — там працює рідний pull-to-refresh
// (через RefreshControl у ScrollView CityScreen). Це навмисне
// Platform-розгалуження: на Android nested ScrollView у горизонтальному
// FlatList ламає RefreshControl (бачили на peek HourlyChart), тому
// для Android надійніший варіант — явна кнопка.
const IS_ANDROID = Platform.OS === 'android';

export default function CityHeader({
  city,
  language,
  isDefault,
  onSettings,
  refreshing = false,
  onRefresh,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const displayName = getCityName(city, language);

  const showRefreshButton = IS_ANDROID && !!onRefresh;

  // Haptic-обгортки: light на ⚙️, medium на refresh (значуща дія).
  const handleSettings = () => {
    haptics.light();
    onSettings?.();
  };
  const handleRefresh = () => {
    if (refreshing) return;
    haptics.medium();
    onRefresh?.();
  };

  return (
    <View style={styles.container}>
      {/* Лівий слот має ту саму ширину що правий — це утримує назву по центру.
          На Android правий слот ширший (бо містить ↻ + ⚙️), тому й ліве
          поле розширюється для симетрії. */}
      <View style={[styles.side, showRefreshButton && styles.sideWide]} />

      <View style={styles.center}>
        {/* Навігація між містами — ТІЛЬКИ горизонтальний свайп FlatList'а.
            Стрілки ‹ › прибрані як residual з ранніх дизайнів — сучасні
            weather-додатки (Apple Weather, Google Weather) теж їх не мають.
            Якщо колись захочеться візуальної підказки про свайп —
            краще додати dot-pagination внизу екрану, не повертати стрілки.

            adjustsFontSizeToFit + minimumFontScale={0.75} — автоматично
            зменшує шрифт назви якщо вона не влазить (для довгих слів типу
            "Хмельницький" на вузьких пристроях). Для коротких ("Київ")
            фіча мовчить, рендериться base size. */}
        <Text
          style={styles.name}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {displayName} {isDefault && <Text style={styles.pin}>📍</Text>}
        </Text>
      </View>

      <View style={[styles.side, showRefreshButton && styles.sideWide, styles.right]}>
        {showRefreshButton && (
          <TouchableOpacity
            onPress={handleRefresh}
            hitSlop={12}
            disabled={refreshing}
            accessibilityLabel="Оновити погоду"
            accessibilityRole="button"
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              // Окремий стиль iconRefresh з явним color: colors.text —
              // ↻ це звичайний Unicode-символ (не emoji), без color він
              // на Android рендериться чорним і не видно в темній темі.
              <Text style={styles.iconRefresh}>↻</Text>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleSettings} hitSlop={12}>
          {/* ⚙️ — emoji, має власні кольори, color у стилі не потрібен. */}
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
    // Дефолтна ширина бічного слоту (iOS / коли тільки ⚙️)
    side: { width: 40 },
    // Розширений слот — коли на Android рендериться ↻ + ⚙️ поряд
    sideWide: { width: 70 },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 14,
    },
    center: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      // paddingHorizontal — гарантоване "повітря" між назвою і бічними
      // слотами. Бонус: довгі назви активують adjustsFontSizeToFit раніше
      // (бо доступна ширина для тексту менша) — auto-shrink спрацьовує плавніше.
      paddingHorizontal: 12,
    },
    // Стиль для emoji-іконок (⚙️). color НЕ задаємо — emoji мають
    // власні кольори.
    icon: { fontSize: scaleFont(20) },
    // Стиль для текстових символів-іконок (↻). ОБОВ'ЯЗКОВО color
    // прив'язаний до теми, інакше на Android буде дефолтний чорний
    // і у темній темі іконка зникає на темному фоні.
    iconRefresh: {
      fontSize: scaleFont(20),
      color: colors.text,
      fontFamily: fonts.bold,
    },
    name: {
      fontSize: scaleFont(20),
      color: colors.text,
      fontFamily: fonts.extraBold,
      letterSpacing: 1,
    },
    pin: { fontSize: scaleFont(16) },
  });