import React from 'react';
import { StyleSheet, View } from 'react-native';
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

export default function WeatherAnimation({ weatherMain, isDay }) {
  const key = getAnimationKey(weatherMain, isDay);

  if (key === 'clouds') return <CloudsAnimation />;
  if (key === 'rain') return <RainAnimation />;
  if (key === 'snow') return <SnowAnimation />;
  if (key === 'clear_day') return <SunAnimation />;
  if (key === 'clear_night') return <MoonAnimation />;
  if (key === 'thunderstorm') return <ThunderstormAnimation />;
  if (key === 'fog') return <FogAnimation />;

  return null;
}