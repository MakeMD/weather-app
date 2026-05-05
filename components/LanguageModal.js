import { useMemo } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SUPPORTED_LANGUAGES, t } from '../i18n';
import { scaleFont } from '../utils/responsive';
import { fonts, radius } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

export default function LanguageModal({ visible, onClose, currentLanguage, onSelectLanguage }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleSelect = (code) => {
    onSelectLanguage(code);
    onClose();
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
          <TouchableOpacity onPress={onClose} hitSlop={20} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('selectLanguage')}</Text>
          <View style={{ flex: 1 }} />
        </View>

        <FlatList
          data={SUPPORTED_LANGUAGES}
          keyExtractor={(item) => item.code}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isActive = item.code === currentLanguage;
            return (
              <TouchableOpacity
                style={[styles.row, isActive && styles.rowActive]}
                onPress={() => handleSelect(item.code)}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <Text style={[styles.name, isActive && styles.nameActive]}>
                  {item.name}
                </Text>
                {isActive && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
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
    backButton: { paddingRight: 4 },
    backIcon: {
      fontSize: scaleFont(34),
      color: colors.text,
      fontFamily: fonts.bold,
    },
    title: {
      fontSize: scaleFont(22),
      color: colors.text,
      fontFamily: fonts.extraBold,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      backgroundColor: colors.cardBackground,
      borderRadius: radius.medium,
      padding: 16,
      marginBottom: 8,
    },
    rowActive: {
      backgroundColor: colors.cardBackgroundLight,
    },
    flag: {
      fontSize: scaleFont(28),
    },
    name: {
      flex: 1,
      fontSize: scaleFont(16),
      color: colors.text,
      fontFamily: fonts.bold,
    },
    nameActive: {
      fontFamily: fonts.extraBold,
    },
    check: {
      fontSize: scaleFont(20),
      color: colors.accent,
      fontFamily: fonts.extraBold,
    },
  });