import React from 'react';
import CloudsAnimation from './animations/CloudsAnimation';
import RainAnimation from './animations/RainAnimation';
import SnowAnimation from './animations/SnowAnimation';
import SunAnimation from './animations/SunAnimation';
import MoonAnimation from './animations/MoonAnimation';
import ThunderstormAnimation from './animations/ThunderstormAnimation';
import FogAnimation from './animations/FogAnimation';

function getAnimationKey(weatherMain, isDay) {
  if (!weatherMain) return null;
  const main = weatherMain.toLowerCase();

  if (main === 'clear') return isDay ? 'clear_day' : 'clear_night';
  if (main === 'clouds') return 'clouds';
  if (main === 'rain' || main === 'drizzle') return 'rain';
  if (main === 'snow') return 'snow';
  if (main === 'thunderstorm') return 'thunderstorm';
  if (main === 'mist' || main === 'fog' || main === 'haze' || main === 'smoke') return 'fog';

  return null;
}

// `palette` — об'єкт від getWeatherPalette: { bg, curve, sun?, moon?, cloud?, ... }.
// Кожна анімація отримує тільки ті поля, що вона уміє споживати; якщо в
// палітрі поля немає — анімація використає свій fallback.
export default function WeatherAnimation({ weatherMain, isDay, palette }) {
  const key = getAnimationKey(weatherMain, isDay);
  const p = palette || {};

  if (key === 'clouds') {
    return <CloudsAnimation color={p.cloud} />;
  }
  if (key === 'rain') {
    return <RainAnimation cloudColor={p.cloud} dropColor={p.rainDrop} />;
  }
  if (key === 'snow') {
    return <SnowAnimation />;
  }
  if (key === 'clear_day') {
    return <SunAnimation color={p.sun} />;
  }
  if (key === 'clear_night') {
    return <MoonAnimation color={p.moon} />;
  }
  if (key === 'thunderstorm') {
    return <ThunderstormAnimation cloudColor={p.cloud} dropColor={p.rainDrop} />;
  }
  if (key === 'fog') {
    return <FogAnimation color={p.fog} />;
  }

  return null;
}