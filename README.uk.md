# Weather App

[English](README.md) · **Українська**

Погодний додаток для iOS і Android з ручними ілюстраціями міст, побудований на Expo + React Native. У кожного міста власна 3D-ілюстрація, поверх якої накладаються нативні анімації погоди (сонце, дощ, сніг, туман, гроза), а палітра підлаштовується під поточні умови і час доби.

![Expo SDK](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=000)
![Platforms](https://img.shields.io/badge/platforms-iOS%20%7C%20Android-blue)
![License](https://img.shields.io/badge/license-TBD-lightgrey)

---

## Скріншоти

> _Незабаром — додамо скріншоти з фізичного пристрою._

---

## Можливості

- 🏙️ **60 кастомних 3D-ілюстрацій міст** (WebP, ~7 МБ загалом)
- 🎬 **7 нативних анімацій погоди** — Сонце, Місяць, Хмари, Дощ, Сніг, Гроза, Туман (Reanimated 4 + SVG)
- 🌍 **26 українських міст** з коробки + пошук по всьому світу через OpenWeatherMap Geocoding
- 📍 **Місто за замовчуванням за GPS** при першому запуску
- 🌐 **5 мов** — англійська, українська, польська, німецька, іспанська — з правильними слов'янськими формами множини (one / few / many)
- 🌗 **Світла, темна, авто** тема зі слухачем системних змін
- 🌡️ **Перемикач одиниць** — °C / °F, м/с / mph, км / милі
- 📊 **Прогноз на 5 днів** + 24-годинна Apple-style крива температури з peek-ефектом
- 🔔 **Локальні погодні нотифікації** про несприятливі умови на завтра (дощ, сніг, гроза, вітер, спека, холод) — без серверу
- 📳 **Тактильний відгук** по всьому додатку, з глобальним перемикачем
- 💾 **TTL-кеш** — 10 хв для поточної погоди, 30 хв для прогнозу
- 📐 **Адаптивний макет** — еталон iPhone 13 (844pt), масштабується від iPhone SE до iPhone 16 Pro Max

---

## Стек технологій

| Сфера              | Бібліотека                                       |
| ------------------ | ------------------------------------------------ |
| Runtime            | Expo SDK 54, React Native 0.81, React 19         |
| Анімації           | `react-native-reanimated` 4, `react-native-svg`  |
| Зображення         | `expo-image` (з кешем на диску)                  |
| Сховище            | `@react-native-async-storage/async-storage`      |
| i18n               | `i18n-js` + кастомний обробник слов'янських множин |
| Нотифікації        | `expo-notifications` (тільки локальні)           |
| Тактильний відгук  | `expo-haptics`                                   |
| Геолокація         | `expo-location`, `suncalc` (схід/захід сонця)    |
| Білд               | EAS Build                                        |

---

## Як запустити

### Передумови

- **Node.js** 20+
- **Expo Go** на фізичному iOS- або Android-пристрої (симулятор підійде для верстки, але не для haptics і нотифікацій)
- Безкоштовний [API-ключ OpenWeatherMap](https://openweathermap.org/api)

### Встановлення

```bash
git clone https://github.com/MakeMD/weather-app.git
cd weather-app
npm install
```

### Конфігурація

```bash
cp config.example.js config.js
```

Відкрий `config.js` і встав свій ключ OpenWeatherMap:

```js
export const OWM_API_KEY = "your_key_here";
```

> `config.js` у `.gitignore`.

### Запуск у режимі розробки

```bash
npx expo start
```

Скануй QR-код у застосунку Expo Go.

---

## Структура проєкту

```
weather-app/
├── App.js                  # Корінь: theme override, scheduling нотифікацій, шар туману
├── components/
│   ├── animations/         # 7 анімацій погоди + SVG-форми хмар
│   ├── CityScreen.js       # Контент міста (прозорий фон)
│   ├── CityImage.js        # 3D-ілюстрація міста
│   ├── WeatherDisplay.js   # Іконка + температура + опис
│   ├── WeatherDetails.js   # Вологість, вітер, відчув., видимість
│   ├── ForecastList.js     # Стрічка прогнозу на 5 днів
│   ├── HourlyChart.js      # 24-годинна Apple-style крива
│   ├── SettingsModal.js    # Міста + Мова / Тема / Одиниці / Haptics / Нотифікації
│   └── …
├── hooks/                  # useCityManager, useWeatherForAll, useForecast
├── utils/                  # api, cache, notifications, haptics, palettes, format
├── contexts/ThemeContext.js
├── styles/theme.js         # Світлі + темні кольори, шрифти, layout-константи
├── data/                   # Українські міста, мапа зображень, persisted user state
├── i18n/                   # 5 локальних JSON + setup
├── assets/cities/          # 60 WebP-ілюстрацій
└── assets/branding/        # Іконка, splash, adaptive icon
```

---

## Білд

EAS-профілі описані в `eas.json`.

**Sideload APK** (для особистого встановлення / тестерів):

```bash
eas build --profile production --platform android
```

**Play Store AAB** (для публікації):

```bash
eas build --profile production-aab --platform android
```

EAS сам керує `version` / `versionCode` віддалено (`appVersionSource: "remote"`) і автоматично інкрементить їх для кожного білду.

---

## Архітектурні цікавинки

Кілька неочевидних рішень, які варто знати:

- **Theme override на App-рівні.** Якщо користувач у режимі auto/light, але на екрані нічне місто (наприклад, Якутськ, поки ти в Києві опівдні), UI локально форситься в темну тему через локальний `ThemeContext.Provider`. Уникає ефекту "яскравого вікна в темну кімнату". Settings і AddCity бачать базову тему.

- **Палітра погоди як окремий шар.** `utils/weatherPalette.js` повертає `{ bg, curve, sun?, rainDrop?, fog?, … }` на основі `(weatherMain, isDay, isDark)`. Незалежно від теми — вони композуються.

- **Атмосферна вуаль туману.** Повноекранний прозорий шар між фоном SafeArea і UI, з `pointerEvents="none"`. Картки мають непрозорий фон, тому перекривають вуаль там, де важлива читабельність.

- **Інтерполяція фону при свайпі.** Анімований `SafeAreaView` інтерполює `backgroundColor` від `scrollX`, тому свайп між містами плавно перетікає атмосферами замість стрибка.

- **Тільки локальні нотифікації.** Заплановані на 20:00 для найгіршої очікуваної умови наступного дня, з пріоритетом (гроза > сніг > дощ > вітер > спека > холод). Перепланувуються при зміні мови, одиниць, default-міста або хешу прогнозу. Без бекенду.

---

## Локалізація

Рядки лежать у `i18n/{en,uk,pl,de,es}.json` (~96 ключів кожний). Щоб додати мову:

1. Скопіюй `i18n/en.json` у `i18n/<locale>.json` і переклади.
2. Зареєструй локаль у `i18n/index.js`.
3. Додай локалізовані поля для міст у `data/cities.js` (ключ на локаль).

Слов'янські форми множини (`tPlural`) автоматично обробляють українську, польську і російську.

---

## Відомі обмеження

- Нотифікації спрацьовують лише коли додаток відкривається (без dev-build / серверу неможливо інакше).
- Push-нотифікації на **Android Expo Go** не підтримуються з SDK 53 — тому ми використовуємо **тільки локальні** нотифікації.
- iOS після відмови у дозволі на нотифікації не можна попросити повторно — додаток показує Alert із кнопкою для відкриття системних налаштувань.
- Haptics і нотифікації потребують **фізичного пристрою** — на симуляторі вони no-op.

---

## Ліцензія

TBD — обери MIT, Apache 2.0 або proprietary залежно від планів.

---

## Подяка

- [OpenWeatherMap](https://openweathermap.org/) — API погоди й геокодування
- [Expo](https://expo.dev/) — runtime, білд-пайплайн, модулі
- 3D-ілюстрації міст створені спеціально для цього проєкту
