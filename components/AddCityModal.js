import { useState, useMemo } from 'react';
import {
  Modal, View, Text, TouchableOpacity, TextInput,
  ActivityIndicator, FlatList, Alert, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CityRow from './CityRow';
import { ukrainianCities } from '../data/cities';
import { searchCitiesWorldwide } from '../utils/api';
import { slugify } from '../utils/format';
import { scaleFont } from '../utils/responsive';
import { fonts, radius } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { t, tPlural } from '../i18n';
import { getCityName, cityMatchesQuery } from '../utils/cityName';

const MAX_CITIES = 10;

export default function AddCityModal({ visible, onClose, userCities, onAddMany, language }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [query, setQuery] = useState('');
  const [apiResults, setApiResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCities, setSelectedCities] = useState(new Map());

  const isAlreadyInList = (id) => userCities.some((c) => c.id === id);
  const isSelected = (id) => selectedCities.has(id);

  const totalAfterAdd = userCities.length + selectedCities.size;

  const localResults = ukrainianCities.filter((c) => cityMatchesQuery(c, query));

  const searchWorldwide = async () => {
    if (!query.trim()) return;
    try {
      setSearching(true);
      const data = await searchCitiesWorldwide(query);

      const seen = new Set();
      const results = [];

      for (const r of data) {
        const baseId = slugify(`${r.name}_${r.country}`);
        const lat = Math.round(r.lat * 100);
        const lon = Math.round(r.lon * 100);
        const uniqueId = `${baseId}_${lat}_${lon}`;

        if (seen.has(uniqueId)) continue;
        seen.add(uniqueId);

        results.push({
          id: uniqueId,
          name: r.name.toUpperCase(),
          country: r.country,
          latitude: r.lat,
          longitude: r.lon,
          region: r.state || null,
        });
      }

      setApiResults(results);
    } catch (e) {
      console.log('API search error:', e);
      Alert.alert(t('errorTitle'), t('errorSearch'));
    } finally {
      setSearching(false);
    }
  };

  const toggleSelect = (city) => {
    setSelectedCities((prev) => {
      const next = new Map(prev);
      if (next.has(city.id)) {
        next.delete(city.id);
      } else {
        if (userCities.length + next.size >= MAX_CITIES) {
          Alert.alert(t('limitTitle'), t('limitText', { max: MAX_CITIES }));
          return prev;
        }
        next.set(city.id, city);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (selectedCities.size === 0) return;
    const cities = Array.from(selectedCities.values());
    onAddMany(cities);
    setQuery('');
    setApiResults([]);
    setSelectedCities(new Map());
    onClose();
  };

  const handleClose = () => {
    setQuery('');
    setApiResults([]);
    setSelectedCities(new Map());
    onClose();
  };

  const renderRow = (item, fromApi) => {
    const alreadyAdded = isAlreadyInList(item.id);
    const selected = isSelected(item.id);

    const cityForDisplay = { ...item, name: getCityName(item, language) };

    let subtitle;
    if (fromApi) {
      const region = [item.region, item.country].filter(Boolean).join(', ');
      subtitle = alreadyAdded ? `${region} · ${t('alreadyAdded')}` : `${region} · ${t('fromWeb')}`;
    } else {
      subtitle = alreadyAdded ? `${item.country} · ${t('alreadyAdded')}` : `${item.country} · ${t('inLibrary')}`;
    }

    let rightSlot;
    if (alreadyAdded) {
      rightSlot = <Text style={styles.checkAdded}>✓</Text>;
    } else if (selected) {
      rightSlot = <Text style={styles.checkSelected}>✓</Text>;
    } else {
      rightSlot = <Text style={styles.checkUnselected}>+</Text>;
    }

    return (
      <CityRow
        key={item.id}
        city={cityForDisplay}
        disabled={alreadyAdded}
        onPress={alreadyAdded ? null : () => toggleSelect(item)}
        subtitle={subtitle}
        rightSlot={rightSlot}
      />
    );
  };

  const selectedCount = selectedCities.size;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} hitSlop={20} style={styles.backButton}>
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{t('addCity')}</Text>
            <View style={{ flex: 1 }} />
            {selectedCount > 0 && (
              <Text style={styles.counter}>
                {totalAfterAdd}/{MAX_CITIES}
              </Text>
            )}
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={t('typeCityName')}
              placeholderTextColor={colors.textLight}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={searchWorldwide}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={searchWorldwide}
              disabled={!query.trim()}
            >
              {searching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.searchButtonText}>{t('worldwide')}</Text>
              )}
            </TouchableOpacity>
          </View>

          <FlatList
            style={{ flex: 1 }}
            data={[]}
            keyExtractor={() => 'placeholder'}
            renderItem={null}
            ListHeaderComponent={
              <View style={{ padding: 16 }}>
                {(query.length === 0 || localResults.length > 0) && (
                  <>
                    <Text style={styles.sectionLabel}>{t('ukrainianCities')}</Text>
                    {(query ? localResults : ukrainianCities).map((item) => renderRow(item, false))}
                  </>
                )}

                {apiResults.length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, { marginTop: 24 }]}>{t('otherCities')}</Text>
                    {apiResults.map((item) => renderRow(item, true))}
                  </>
                )}

                {query.length > 0 && localResults.length === 0 && apiResults.length === 0 && !searching && (
                  <Text style={styles.hint}>
                    {t('searchHint', { query })}
                  </Text>
                )}
              </View>
            }
          />

          {selectedCount > 0 && (
            <View style={styles.footer}>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmButtonText}>
                  {tPlural('addNCities', selectedCount)}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
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
    counter: {
      fontSize: scaleFont(14),
      color: colors.textLight,
      fontFamily: fonts.bold,
    },
    searchContainer: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    searchInput: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      borderRadius: radius.small,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: scaleFont(16),
      fontFamily: fonts.regular,
      color: colors.text,
    },
    searchButton: {
      backgroundColor: colors.accentDark,
      paddingHorizontal: 18,
      justifyContent: 'center',
      borderRadius: radius.small,
      minWidth: 100,
    },
    searchButtonText: {
      color: 'white',
      fontSize: scaleFont(13),
      fontFamily: fonts.bold,
    },
    sectionLabel: {
      fontSize: scaleFont(12),
      color: colors.textLight,
      fontFamily: fonts.bold,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
    },
    hint: {
      fontSize: scaleFont(14),
      color: colors.textLight,
      textAlign: 'center',
      fontFamily: fonts.regular,
      marginTop: 24,
    },
    checkAdded: {
      fontSize: scaleFont(20),
      color: colors.textLight,
      fontFamily: fonts.bold,
      paddingHorizontal: 8,
    },
    checkSelected: {
      fontSize: scaleFont(24),
      color: colors.accent,
      fontFamily: fonts.extraBold,
      paddingHorizontal: 8,
    },
    checkUnselected: {
      fontSize: scaleFont(24),
      color: colors.textLight,
      fontFamily: fonts.regular,
      paddingHorizontal: 8,
    },
    footer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      backgroundColor: colors.background,
    },
    confirmButton: {
      backgroundColor: colors.accentDark,
      borderRadius: radius.small,
      paddingVertical: 14,
      alignItems: 'center',
    },
    confirmButtonText: {
      color: 'white',
      fontSize: scaleFont(15),
      fontFamily: fonts.bold,
    },
  });