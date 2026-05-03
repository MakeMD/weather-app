import { useState } from 'react';
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
import { colors, fonts, radius } from '../styles/theme';

const MAX_CITIES = 10;

export default function AddCityModal({ visible, onClose, userCities, onAdd }) {
  const [query, setQuery] = useState('');
  const [apiResults, setApiResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const isAdded = (id) => userCities.some((c) => c.id === id);

  const localResults = ukrainianCities.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  const searchWorldwide = async () => {
    if (!query.trim()) return;
    try {
      setSearching(true);
      const data = await searchCitiesWorldwide(query);

      // Перетворюємо у формат наших міст із унікальним id
      const seen = new Set();
      const results = [];

      for (const r of data) {
        // Базовий id (для пошуку картинки): warsaw_pl
        const baseId = slugify(`${r.name}_${r.country}`);

        // Унікальний id (для React-ключів): warsaw_pl_5223_2101 з координатами
        const lat = Math.round(r.lat * 100);
        const lon = Math.round(r.lon * 100);
        const uniqueId = `${baseId}_${lat}_${lon}`;

        // Захист від повних дублікатів
        if (seen.has(uniqueId)) continue;
        seen.add(uniqueId);

        results.push({
          id: uniqueId,
          name: r.name.toUpperCase(),
          country: r.country,
          latitude: r.lat,
          longitude: r.lon,
          // Допоміжний регіон: state з API, якщо є — для розрізнення міст-тезок
          region: r.state || null,
        });
      }

      setApiResults(results);
    } catch (e) {
      console.log('API search error:', e);
      Alert.alert('Помилка', 'Не вдалось виконати пошук. Перевірте інтернет.');
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = (city) => {
    if (isAdded(city.id)) {
      Alert.alert('Місто вже додане');
      return;
    }
    if (userCities.length >= MAX_CITIES) {
      Alert.alert('Ліміт', `Максимум ${MAX_CITIES} міст. Спершу видаліть якесь.`);
      return;
    }
    onAdd(city);
    setQuery('');
    setApiResults([]);
  };

  const handleClose = () => {
    setQuery('');
    setApiResults([]);
    onClose();
  };

  const renderRow = (item, fromApi) => {
    const added = isAdded(item.id);
    const subtitle = fromApi
      ? `${[item.region, item.country].filter(Boolean).join(', ')} · From web`
      : `${item.country} · In library`;
    return (
      <CityRow
        key={item.id}
        city={item}
        disabled={added}
        onPress={() => handleAdd(item)}
        subtitle={subtitle}
        rightSlot={<Text style={styles.addIcon}>{added ? '✓' : '+'}</Text>}
      />
    );
  };

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
            <Text style={styles.title}>Add city</Text>
            <View style={{ flex: 1 }} />
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Type city name..."
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
                <Text style={styles.searchButtonText}>Worldwide</Text>
              )}
            </TouchableOpacity>
          </View>

          <FlatList
            data={[]}
            keyExtractor={() => 'placeholder'}
            renderItem={null}
            ListHeaderComponent={
              <View style={{ padding: 16 }}>
                {(query.length === 0 || localResults.length > 0) && (
                  <>
                    <Text style={styles.sectionLabel}>Ukrainian cities</Text>
                    {(query ? localResults : ukrainianCities).map((item) => renderRow(item, false))}
                  </>
                )}

                {apiResults.length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Other cities</Text>
                    {apiResults.map((item) => renderRow(item, true))}
                  </>
                )}

                {query.length > 0 && localResults.length === 0 && apiResults.length === 0 && !searching && (
                  <Text style={styles.hint}>
                    Натисніть «Worldwide», щоб знайти "{query}" в інтернеті
                  </Text>
                )}
              </View>
            }
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
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
  addIcon: {
    fontSize: scaleFont(24),
    color: colors.accent,
    fontFamily: fonts.bold,
    paddingHorizontal: 8,
  },
});