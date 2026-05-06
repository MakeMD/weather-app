import { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CityRow from './CityRow';
import { scaleFont } from '../utils/responsive';
import { fonts, radius } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { t, SUPPORTED_LANGUAGES } from '../i18n';
import { getCityName } from '../utils/cityName';
import { haptics } from '../utils/haptics';

const MAX_CITIES = 10;

export default function SettingsModal({
  visible,
  onClose,
  userCities,
  defaultCityId,
  onSetDefault,
  onRemove,
  onAddPress,
  language,
  themePreference,
  units,
  onLanguagePress,
  onThemePress,
  onToggleUnits,
  // ⬇️ нові пропси для глобального haptic toggle
  hapticsEnabled,
  onToggleHaptics,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Поточна мова — назва і прапор
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language);
  const langLabel = currentLang ? `${currentLang.flag} ${currentLang.name}` : language;

  // Поточна тема — локалізована назва
  const themeLabel =
    themePreference === 'light' ? t('themeLight')
    : themePreference === 'dark' ? t('themeDark')
    : t('themeAuto');

  // Поточні одиниці — локалізована назва
  const unitsLabel = units === 'imperial' ? t('unitsImperial') : t('unitsMetric');

  // Стан haptic toggle — локалізована "Увімкн/Вимкн"
  const hapticsLabel = hapticsEnabled ? t('on') : t('off');

  // ----- Haptic-обгортки (один паттерн для всіх дій у Settings) -----
  const handleSetDefault = (id) => {
    haptics.light();
    onSetDefault(id);
  };
  const handleAddPress = () => {
    haptics.light();
    onAddPress();
  };
  const handleLanguagePress = () => {
    haptics.light();
    onLanguagePress();
  };
  const handleThemePress = () => {
    haptics.light();
    onThemePress();
  };
  const handleToggleUnits = () => {
    haptics.selection();
    onToggleUnits();
  };
  // Нюанс для haptic-toggle: спочатку викликаємо toggle (синхронно оновлює
  // state + module flag), потім haptics.selection(). Wrapper перевіряє
  // module flag → ON→OFF не вібрує (бо flag вже false), OFF→ON вібрує.
  // Це зумисне: ON→OFF "тиша" сигналізує що тепер дійсно вимкнено.
  const handleToggleHaptics = () => {
    onToggleHaptics();
    haptics.selection();
  };

  const renderItem = ({ item }) => {
    const isDefault = item.id === defaultCityId;
    const canRemove = !isDefault && userCities.length > 1;

    const cityForDisplay = { ...item, name: getCityName(item, language) };

    return (
      <CityRow
        city={cityForDisplay}
        rightSlot={
          <View style={styles.actions}>
            {isDefault ? (
              <Text style={styles.defaultBadge}>★ {t('default')}</Text>
            ) : (
              <TouchableOpacity onPress={() => handleSetDefault(item.id)}>
                <Text style={styles.setDefaultLink}>{t('default')}</Text>
              </TouchableOpacity>
            )}
            {canRemove && (
              <TouchableOpacity
                onPress={() => confirmRemove(item.id, onRemove)}
                style={styles.removeButton}
                hitSlop={10}
              >
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('settings')}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={20}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={userCities}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('cities')}</Text>
              <Text style={styles.sectionCounter}>{userCities.length} / {MAX_CITIES}</Text>
            </View>
          }
          ListFooterComponent={
            <>
              {userCities.length < MAX_CITIES && (
                <TouchableOpacity style={styles.addButton} onPress={handleAddPress}>
                  <Text style={styles.addButtonText}>+ {t('addCity')}</Text>
                </TouchableOpacity>
              )}

              <View style={[styles.sectionHeader, { marginTop: 28 }]}>
                <Text style={styles.sectionTitle}>{t('settings')}</Text>
              </View>

              <SettingRow
                icon="🌐"
                label={t('language')}
                value={langLabel}
                onPress={handleLanguagePress}
                styles={styles}
                showChevron
              />

              <SettingRow
                icon={themePreference === 'dark' ? '🌙' : themePreference === 'light' ? '☀️' : '🌗'}
                label={t('theme')}
                value={themeLabel}
                onPress={handleThemePress}
                styles={styles}
                showChevron
              />

              <SettingRow
                icon="⇄"
                label={t('units')}
                value={unitsLabel}
                onPress={handleToggleUnits}
                styles={styles}
                showChevron={false}
              />

              {/* Новий рядок — глобальний toggle Haptic feedback */}
              <SettingRow
                icon="📳"
                label={t('hapticFeedback')}
                value={hapticsLabel}
                onPress={handleToggleHaptics}
                styles={styles}
                showChevron={false}
              />
            </>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

function SettingRow({ icon, label, value, onPress, styles, showChevron }) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={styles.settingTextBlock}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingValue} numberOfLines={1}>{value}</Text>
      </View>
      {showChevron && <Text style={styles.settingChevron}>›</Text>}
    </TouchableOpacity>
  );
}

function confirmRemove(id, onRemove) {
  Alert.alert(t('remove') + '?', '', [
    { text: t('cancel'), style: 'cancel' },
    {
      text: t('remove'),
      style: 'destructive',
      onPress: () => {
        haptics.warning(); // вібрація-попередження перед руйнівною дією
        onRemove(id);
      },
    },
  ]);
}

const createStyles = (colors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    title: {
      flex: 1,
      fontSize: scaleFont(22),
      color: colors.text,
      fontFamily: fonts.extraBold,
    },
    closeIcon: {
      fontSize: scaleFont(22),
      color: colors.text,
      paddingHorizontal: 4,
    },
    list: { padding: 16, paddingBottom: 40 },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      paddingHorizontal: 4,
      marginBottom: 8,
    },
    sectionTitle: {
      flex: 1,
      fontSize: scaleFont(12),
      color: colors.textLight,
      fontFamily: fonts.bold,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    sectionCounter: {
      fontSize: scaleFont(12),
      color: colors.textLight,
      fontFamily: fonts.regular,
    },

    actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    defaultBadge: {
      fontSize: scaleFont(12),
      color: colors.warning,
      fontFamily: fonts.bold,
    },
    setDefaultLink: {
      fontSize: scaleFont(12),
      color: colors.accent,
      fontFamily: fonts.regular,
    },
    removeButton: { padding: 8 },
    removeText: {
      fontSize: scaleFont(18),
      color: colors.errorDark,
      fontFamily: fonts.bold,
    },

    addButton: {
      backgroundColor: colors.accentDark,
      paddingVertical: 16,
      borderRadius: radius.large,
      alignItems: 'center',
      marginTop: 8,
    },
    addButtonText: {
      color: 'white',
      fontSize: scaleFont(16),
      fontFamily: fonts.bold,
    },

    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: colors.cardBackground,
      borderRadius: radius.medium,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    settingIcon: {
      fontSize: scaleFont(22),
      width: 28,
      textAlign: 'center',
    },
    settingTextBlock: {
      flex: 1,
      gap: 2,
    },
    settingLabel: {
      fontSize: scaleFont(11),
      color: colors.textLight,
      fontFamily: fonts.regular,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    settingValue: {
      fontSize: scaleFont(15),
      color: colors.text,
      fontFamily: fonts.bold,
    },
    settingChevron: {
      fontSize: scaleFont(22),
      color: colors.textLight,
      fontFamily: fonts.regular,
      paddingHorizontal: 4,
    },
  });