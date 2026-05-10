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
  showArrows,
  onPrevious,
  onNext,
  onSettings,
  refreshing = false,
  onRefresh,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const displayName = getCityName(city, language);

  const showRefreshButton = IS_ANDROID && !!onRefresh;

  // Haptic-обгортки: light на стрілках і ⚙️, medium на refresh (значуща дія).
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
        {showArrows && (
          <TouchableOpacity onPress={handlePrevious} hitSlop={12}>
            <Text style={styles.arrow}>‹</Text>
          </TouchableOpacity>
        )}
        {/* adjustsFontSizeToFit + minimumFontScale={0.75} — автоматично
            зменшує шрифт назви якщо вона не влазить у доступну ширину.
            Без цього на вузьких пристроях типу Galaxy S21 (384dp) довгі
            слова на кшталт "Хмельницький" обрізалися крапками.
            minimumFontScale обмежує наскільки можна зменшувати: 0.75 ⇒
            мінімум ~15px (від базових 20). Для коротких назв ("Київ",
            "Львів") поведінка не змінюється — фіча мовчить. */}
        <Text
          style={styles.name}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {displayName} {isDefault && <Text style={styles.pin}>📍</Text>}
        </Text>
        {showArrows && (
          <TouchableOpacity onPress={handleNext} hitSlop={12}>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
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
      gap: 8,
      // paddingHorizontal — гарантоване "повітря" між group (стрілки+назва)
      // і бічними слотами. Без нього при довгій назві стрілка › наближалася
      // впритул до кнопки ↻ на Android (вони візуально зливалися).
      // Бонус: довгі назви активують adjustsFontSizeToFit раніше — auto-shrink
      // спрацьовує плавніше.
      paddingHorizontal: 12,
    },
    // Стиль для emoji-іконок (⚙️ і подібних). color НЕ задаємо —
    // emoji мають власні кольори.
    icon: { fontSize: scaleFont(20) },
    // Стиль для текстових символів-іконок (↻). ОБОВ'ЯЗКОВО color
    // прив'язаний до теми, інакше на Android буде дефолтний чорний
    // і у темній темі іконка зникає на темному фоні.
    iconRefresh: {
      fontSize: scaleFont(20),
      color: colors.text,
      fontFamily: fonts.bold,
    },
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