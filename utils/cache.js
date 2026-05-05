import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'cache';

function buildStorageKey(namespace, lang, units, key) {
  return `${PREFIX}:${namespace}:${lang}:${units}:${key}`;
}

export function createCache(namespace, ttlMs) {
  const memory = new Map();

  function memoryKey(lang, units, key) {
    return `${lang}:${units}:${key}`;
  }

  return {
    async get(lang, units, key) {
      const mKey = memoryKey(lang, units, key);
      const memEntry = memory.get(mKey);
      if (memEntry) {
        const fresh = Date.now() - memEntry.fetchedAt < ttlMs;
        return { ...memEntry, fresh };
      }

      try {
        const raw = await AsyncStorage.getItem(buildStorageKey(namespace, lang, units, key));
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        if (!parsed?.data || !parsed?.fetchedAt) return null;

        memory.set(mKey, parsed);
        const fresh = Date.now() - parsed.fetchedAt < ttlMs;
        return { ...parsed, fresh };
      } catch (e) {
        console.log(`[cache:${namespace}] get error:`, e);
        return null;
      }
    },

    async set(lang, units, key, data) {
      const entry = { data, fetchedAt: Date.now() };
      memory.set(memoryKey(lang, units, key), entry);
      try {
        await AsyncStorage.setItem(
          buildStorageKey(namespace, lang, units, key),
          JSON.stringify(entry)
        );
      } catch (e) {
        console.log(`[cache:${namespace}] set error:`, e);
      }
    },

    /**
     * Завантажує дані для багатьох ключів одним запитом до AsyncStorage.
     * Повертає Map: { key: { data, fetchedAt, fresh } }
     * Якщо запису немає — ключа в Map нема.
     *
     * Це швидше, ніж викликати get() в циклі — multiGet робить 1 запит замість N.
     */
    async bulkGet(lang, units, keys) {
      const result = new Map();
      if (!keys.length) return result;

      // 1. Спочатку дивимось у memory (без черги до диску)
      const missingKeys = [];
      for (const key of keys) {
        const memEntry = memory.get(memoryKey(lang, units, key));
        if (memEntry) {
          const fresh = Date.now() - memEntry.fetchedAt < ttlMs;
          result.set(key, { ...memEntry, fresh });
        } else {
          missingKeys.push(key);
        }
      }

      if (!missingKeys.length) return result;

      // 2. Решту дотягуємо одним multiGet
      try {
        const storageKeys = missingKeys.map((k) => buildStorageKey(namespace, lang, units, k));
        const pairs = await AsyncStorage.multiGet(storageKeys);

        for (let i = 0; i < pairs.length; i++) {
          const [, raw] = pairs[i];
          if (!raw) continue;

          try {
            const parsed = JSON.parse(raw);
            if (!parsed?.data || !parsed?.fetchedAt) continue;

            const key = missingKeys[i];
            memory.set(memoryKey(lang, units, key), parsed);
            const fresh = Date.now() - parsed.fetchedAt < ttlMs;
            result.set(key, { ...parsed, fresh });
          } catch (e) {
            // skip corrupted entries
          }
        }
      } catch (e) {
        console.log(`[cache:${namespace}] bulkGet error:`, e);
      }

      return result;
    },

    async clearScope(lang, units) {
      const prefix = `${lang}:${units}:`;
      for (const k of [...memory.keys()]) {
        if (k.startsWith(prefix)) memory.delete(k);
      }

      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const storagePrefix = `${PREFIX}:${namespace}:${lang}:${units}:`;
        const toRemove = allKeys.filter((k) => k.startsWith(storagePrefix));
        if (toRemove.length > 0) {
          await AsyncStorage.multiRemove(toRemove);
        }
      } catch (e) {
        console.log(`[cache:${namespace}] clearScope error:`, e);
      }
    },

    async clearLanguage(lang) {
      const prefix = `${lang}:`;
      for (const k of [...memory.keys()]) {
        if (k.startsWith(prefix)) memory.delete(k);
      }

      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const storagePrefix = `${PREFIX}:${namespace}:${lang}:`;
        const toRemove = allKeys.filter((k) => k.startsWith(storagePrefix));
        if (toRemove.length > 0) {
          await AsyncStorage.multiRemove(toRemove);
        }
      } catch (e) {
        console.log(`[cache:${namespace}] clearLanguage error:`, e);
      }
    },
  };
}

export const weatherCache = createCache('weather', 10 * 60 * 1000);
export const forecastCache = createCache('forecast', 30 * 60 * 1000);