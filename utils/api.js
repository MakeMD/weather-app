import { WEATHER_API_KEY } from '../config';

const BASE_URL = 'https://api.openweathermap.org';

const LANG_MAP = {
  en: 'en',
  uk: 'ua',
  pl: 'pl',
  de: 'de',
  es: 'es',
};

function getApiLang(lang) {
  return LANG_MAP[lang] || 'en';
}

function getApiUnits(units) {
  // OpenWeatherMap: 'metric' | 'imperial' | 'standard' (Kelvin)
  return units === 'imperial' ? 'imperial' : 'metric';
}

export const fetchCurrentWeather = async (latitude, longitude, lang = 'en', units = 'metric') => {
  const apiLang = getApiLang(lang);
  const apiUnits = getApiUnits(units);
  const url = `${BASE_URL}/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=${apiUnits}&lang=${apiLang}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Status ${response.status}`);
  return response.json();
};

export const searchCitiesWorldwide = async (query) => {
  const url = `${BASE_URL}/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${WEATHER_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('API error');
  return response.json();
};

export const fetchForecast = async (latitude, longitude, lang = 'en', units = 'metric') => {
  const apiLang = getApiLang(lang);
  const apiUnits = getApiUnits(units);
  const url = `${BASE_URL}/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=${apiUnits}&lang=${apiLang}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Forecast status ${response.status}`);
  return response.json();
};