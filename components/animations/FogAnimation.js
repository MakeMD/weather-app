// components/animations/FogAnimation.js
import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Stop, Rect, SvgXml } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FOG_COLOR = '#C8C4BC';

// Параметри загальної завіси: вертикальний градієнт прозорості.
// Туман у природі стелиться знизу — тому низ густіший, верх рідший.
const FOG_VEIL = {
  topOpacity: 0.30,     // вгорі екрану — туман рідший
  bottomOpacity: 0.65,  // внизу — щільний
  pulseAmount: 0.08,    // на скільки гойдається — "дихання" туману
  pulseDuration: 6500,  // 6.5 сек повний цикл — неспішне дихання
};

// --- Загальна завіса туману ---
// Повноекранний SVG-прямокутник з вертикальним градієнтом + м'яка пульсація прозорості.
function FogVeil() {
  const breath = useSharedValue(1);

  useEffect(() => {
    // breath коливається 1 ↔ (1 - pulseAmount), тобто туман то трохи рідший, то нормальний
    breath.value = withRepeat(
      withTiming(1 - FOG_VEIL.pulseAmount, {
        duration: FOG_VEIL.pulseDuration,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true // реверс — туди-назад
    );
    return () => cancelAnimation(breath);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: breath.value,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]} pointerEvents="none">
      <Svg
        style={StyleSheet.absoluteFill}
        preserveAspectRatio="none"
        viewBox="0 0 1 1"
      >
        <Defs>
          <LinearGradient id="fogVeil" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={FOG_COLOR} stopOpacity={FOG_VEIL.topOpacity} />
            <Stop offset="100%" stopColor={FOG_COLOR} stopOpacity={FOG_VEIL.bottomOpacity} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="1" height="1" fill="url(#fogVeil)" />
      </Svg>
    </Animated.View>
  );
}

// --- SVG-силует туманної смуги ---
function buildBandSvg(color, peakOpacity) {
  return `<svg viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="fog" cx="50%" cy="50%" rx="50%" ry="50%">
        <stop offset="0%" stop-color="${color}" stop-opacity="${peakOpacity}"/>
        <stop offset="50%" stop-color="${color}" stop-opacity="${peakOpacity * 0.6}"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="200" cy="50" rx="200" ry="50" fill="url(#fog)"/>
  </svg>`;
}

// --- Одна смуга, що дрейфує зліва направо ---
function FogBand({
  topPercent, width, height, duration, delay,
  peakOpacity, startOffset, color,
}) {
  const initialX = -width + (SCREEN_WIDTH + width) * startOffset;
  const translateX = useSharedValue(initialX);

  useEffect(() => {
    const remaining = SCREEN_WIDTH - initialX;
    const remainingDuration = (remaining / (SCREEN_WIDTH + width)) * duration;

    translateX.value = withDelay(
      delay,
      withTiming(SCREEN_WIDTH, { duration: remainingDuration, easing: Easing.linear }, () => {
        translateX.value = -width;
        translateX.value = withRepeat(
          withTiming(SCREEN_WIDTH, { duration, easing: Easing.linear }),
          -1,
          false
        );
      })
    );

    return () => cancelAnimation(translateX);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const svg = useMemo(() => buildBandSvg(color, peakOpacity), [color, peakOpacity]);

  return (
    <Animated.View
      style={[styles.bandWrapper, { top: `${topPercent}%`, width, height }, animatedStyle]}
      pointerEvents="none"
    >
      <SvgXml xml={svg} width={width} height={height} />
    </Animated.View>
  );
}

function generateBands(count) {
  const bands = [];
  for (let i = 0; i < count; i++) {
    bands.push({
      topPercent: Math.random() * 80,
      width: SCREEN_WIDTH * (0.7 + Math.random() * 0.6),
      height: 60 + Math.random() * 70,
      duration: 25000 + Math.random() * 15000,
      delay: Math.random() * 2000,
      startOffset: Math.random(),
      peakOpacity: 0.45 + Math.random() * 0.3,
    });
  }
  return bands;
}

export default function FogAnimation({ intensity = 1 }) {
  const bands = useMemo(
    () => generateBands(Math.round(6 * intensity)),
    [intensity]
  );

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Шар 1: загальна завіса — знижує видимість міста */}
      <FogVeil />

      {/* Шар 2: дрейфуючі смуги — додають локальну густоту і рух */}
      {bands.map((b, i) => (
        <FogBand key={i} {...b} color={FOG_COLOR} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bandWrapper: {
    position: 'absolute',
  },
});