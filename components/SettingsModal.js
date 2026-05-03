import { Modal, View, Text, TouchableOpacity, FlatList, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CityRow from './CityRow';
import { scaleFont } from '../utils/responsive';
import { colors, fonts, radius } from '../styles/theme';

const MAX_CITIES = 10;

export default function SettingsModal({
  visible,
  onClose,
  userCities,
  defaultCityId,
  onSetDefault,
  onRemove,
  onAddPress,
}) {
  const renderItem = ({ item }) => {
    const isDefault = item.id === defaultCityId;
    const canRemove = !isDefault && userCities.length > 1;

    return (
      <CityRow
        city={item}
        rightSlot={
          <View style={styles.actions}>
            {isDefault ? (
              <Text style={styles.defaultBadge}>★ Default</Text>
            ) : (
              <TouchableOpacity onPress={() => onSetDefault(item.id)}>
                <Text style={styles.setDefaultLink}>Set as default</Text>
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
          <Text style={styles.title}>Cities</Text>
          <Text style={styles.counter}>{userCities.length} / {MAX_CITIES}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={20}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={userCities}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />

        {userCities.length < MAX_CITIES && (
          <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
            <Text style={styles.addButtonText}>+ Add city</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </Modal>
  );
}

function confirmRemove(id, onRemove) {
  Alert.alert('Remove city?', '', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: () => onRemove(id) },
  ]);
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
  title: {
    fontSize: scaleFont(22),
    color: colors.text,
    fontFamily: fonts.extraBold,
  },
  counter: {
    fontSize: scaleFont(14),
    color: colors.textLight,
    fontFamily: fonts.regular,
    marginLeft: 'auto',
  },
  closeIcon: {
    fontSize: scaleFont(22),
    color: colors.text,
    paddingHorizontal: 4,
  },
  list: { padding: 16, paddingBottom: 100 },
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
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: colors.accentDark,
    paddingVertical: 16,
    borderRadius: radius.large,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: scaleFont(16),
    fontFamily: fonts.bold,
  },
});