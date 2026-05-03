import { WEATHER_API_KEY } from '../config';

const BASE_URL = 'https://api.openweathermap.org';

export const fetchCurrentWeather = async (latitude, longitude) => {
  const url = `${BASE_URL}/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric&lang=en`;
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