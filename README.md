# Weather App

**English** · [Українська](README.uk.md)

A hand-illustrated weather app for iOS and Android, built with Expo + React Native. Each city has its own custom 3D illustration, layered with native weather animations (sun, rain, snow, fog, thunderstorms) and a palette that adapts to the conditions and time of day.

![Expo SDK](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=000)
![Platforms](https://img.shields.io/badge/platforms-iOS%20%7C%20Android-blue)
![License](https://img.shields.io/badge/license-TBD-lightgrey)

---

## Screenshots

> _Coming soon — add screenshots from a physical device here._

---

## Features

- 🏙️ **60 custom 3D city illustrations** (WebP, ~7 MB total)
- 🎬 **7 native weather animations** — Sun, Moon, Clouds, Rain, Snow, Thunderstorm, Fog (built with Reanimated 4 + SVG)
- 🌍 **26 Ukrainian cities** out of the box + worldwide search via OpenWeatherMap Geocoding
- 📍 **Default city by GPS** on first launch
- 🌐 **5 languages** — English, Ukrainian, Polish, German, Spanish — with proper Slavic plural forms (one / few / many)
- 🌗 **Light, Dark, Auto** theme with system listener
- 🌡️ **Units toggle** — °C / °F, m/s / mph, km / mi
- 📊 **5-day forecast** + 24h Apple-style temperature curve (peek effect)
- 🔔 **Local weather notifications** for tomorrow's adverse conditions (rain, snow, thunder, wind, heat, cold) — no server required
- 📳 **Haptic feedback** throughout, with global toggle
- 💾 **TTL cache** — 10 min for current weather, 30 min for forecast
- 📐 **Adaptive layout** — references iPhone 13 (844pt), scales gracefully from iPhone SE to iPhone 16 Pro Max

---

## Tech Stack

| Area              | Library                                          |
| ----------------- | ------------------------------------------------ |
| Runtime           | Expo SDK 54, React Native 0.81, React 19         |
| Animations        | `react-native-reanimated` 4, `react-native-svg`  |
| Images            | `expo-image` (with disk cache)                   |
| Storage           | `@react-native-async-storage/async-storage`      |
| i18n              | `i18n-js` + custom Slavic plural handler         |
| Notifications     | `expo-notifications` (local only)                |
| Haptics           | `expo-haptics`                                   |
| Geolocation       | `expo-location`, `suncalc` (sunrise/sunset)      |
| Build             | EAS Build                                        |

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **Expo Go** on a physical iOS or Android device (a simulator works for layout, but not for haptics or notifications)
- A free [OpenWeatherMap API key](https://openweathermap.org/api)

### Installation

```bash
git clone https://github.com/MakeMD/weather-app.git
cd weather-app
npm install
```

### Configuration

```bash
cp config.example.js config.js
```

Then open `config.js` and paste your OpenWeatherMap key:

```js
export const OWM_API_KEY = "your_key_here";
```

> `config.js` is gitignored.

### Running in development

```bash
npx expo start
```

Scan the QR code with Expo Go.

---

## Project Structure

```
weather-app/
├── App.js                  # Root: theme override, notifications scheduling, fog layer
├── components/
│   ├── animations/         # 7 weather animations + cloud SVG paths
│   ├── CityScreen.js       # Per-city content (transparent background)
│   ├── CityImage.js        # 3D city illustration
│   ├── WeatherDisplay.js   # Icon + temperature + description
│   ├── WeatherDetails.js   # Humidity, wind, feels-like, visibility
│   ├── ForecastList.js     # 5-day forecast strip
│   ├── HourlyChart.js      # 24h Apple-style curve
│   ├── SettingsModal.js    # Cities + Language / Theme / Units / Haptics / Notifications
│   └── …
├── hooks/                  # useCityManager, useWeatherForAll, useForecast
├── utils/                  # api, cache, notifications, haptics, palettes, format
├── contexts/ThemeContext.js
├── styles/theme.js         # Light + dark colors, fonts, layout constants
├── data/                   # Ukrainian cities, city image map, persisted user state
├── i18n/                   # 5 locale JSONs + setup
├── assets/cities/          # 60 WebP illustrations
└── assets/branding/        # App icon, splash, adaptive icon
```

---

## Building

EAS profiles are defined in `eas.json`.

**Sideload APK** (for personal install / testers):

```bash
eas build --profile production --platform android
```

**Play Store AAB** (when publishing):

```bash
eas build --profile production-aab --platform android
```

EAS manages `version` / `versionCode` remotely (`appVersionSource: "remote"`) and auto-increments per build.

---

## Architecture Highlights

A few non-obvious decisions worth knowing about:

- **Theme override at App level.** When the user is on auto/light theme but a night city is on screen (e.g. Yakutsk while you're in Kyiv at noon), the UI is locally forced to dark via a wrapping `ThemeContext.Provider`. Avoids the "bright window into a dark room" effect. Settings and AddCity screens still see the base theme.

- **Weather palette as a separate layer.** `utils/weatherPalette.js` returns `{ bg, curve, sun?, rainDrop?, fog?, … }` based on `(weatherMain, isDay, isDark)`. Independent of theme — they compose.

- **Atmospheric fog veil.** Full-screen transparent layer rendered between the SafeArea background and the UI, with `pointerEvents="none"`. Cards have opaque backgrounds so they cover it where readability matters.

- **Background interpolation on swipe.** The animated `SafeAreaView` interpolates `backgroundColor` from `scrollX`, so swiping between cities crossfades atmospheres smoothly instead of popping.

- **Local-only notifications.** Scheduled at 20:00 for tomorrow's worst expected condition, with a priority order (thunder > snow > rain > wind > heat > cold). Re-scheduled whenever language, units, default city, or forecast hash changes. No backend.

---

## Localization

Strings live in `i18n/{en,uk,pl,de,es}.json` (~96 keys each). To add a language:

1. Copy `i18n/en.json` to `i18n/<locale>.json` and translate.
2. Register the locale in `i18n/index.js`.
3. Add localized name fields for cities in `data/cities.js` (key per locale).

Slavic plurals (`tPlural`) handle Ukrainian, Polish, and Russian forms automatically.

---

## Known Limitations

- Notifications fire only when the app is opened (no background scheduling without a dev build / server).
- Push notifications on **Android Expo Go** are unsupported since SDK 53 — that's why we use **local** notifications only.
- iOS, once denied notification permission, cannot re-prompt — the app shows an alert that opens system Settings instead.
- Haptics and notifications require a **physical device** — they no-op on simulators.

---

## License

TBD — pick MIT, Apache 2.0, or proprietary depending on your plans.

---

## Acknowledgements

- [OpenWeatherMap](https://openweathermap.org/) — weather + geocoding API
- [Expo](https://expo.dev/) — runtime, build pipeline, modules
- 3D city illustrations crafted specifically for this project
