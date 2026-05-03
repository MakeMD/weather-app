import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'weatherapp:userdata';

export const loadUserData = async () => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    return JSON.parse(json);
  } catch (e) {
    console.log('Storage load error:', e);
    return null;
  }
};

export const saveUserData = async (data) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.log('Storage save error:', e);
  }
};