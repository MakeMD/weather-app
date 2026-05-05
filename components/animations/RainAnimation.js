// components/animations/RainAnimation.js
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
import { SvgXml } from 'react-native-svg';
import { CLOUD_1, CLOUD_2, CLOUD_3, CLOUD_4 } from './cloudShapes';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const DARK_CLOUD_COLOR = '#6B6258';
export const RAIN_COLOR = '#9FB0BF';

function shiftColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function tintDarkCloudSvg(svg, baseColor) {
  const c1 = shiftColor(baseColor, 45);
  const c4 = shiftColor(baseColor, 38);
  const c2 = shiftColor(baseColor, 22);
  const c3 = shiftColor(baseColor, 5);
  return svg
    .replace(/__C1__/g, c1)
    .replace(/__C2__/g, c2)
    .replace(/__C3__/g, c3)
    .replace(/__C4__/g, c4);
}

export const CLOUD_TEMPLATES = [CLOUD_1, CLOUD_2, CLOUD_3, CLOUD_4];

// --- Темна хмара зверху ---
export function DarkCloud({ topPercent, size, duration, delay, opacity, tintedSvg }) {
  const translateX = useSharedValue(-size);

  useEffect(() => {
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(SCREEN_WIDTH + size, { duration, easing: Easing.linear }),
        -1,
        false
      )
    );
    return () => cancelAnimation(translateX);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      style={[styles.cloudWrapper, { top: `${topPercent}%`, opacity }, animatedStyle]}
      pointerEvents="none"
    >
      <SvgXml xml={tintedSvg} width={size} height={size * 0.85} />
    </Animated.View>
  );
}

// --- Одна крапля ---
export function Raindrop({ leftPercent, length, thickness, duration, delay, opacity, color }) {
  const translateY = useSharedValue(-length);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(SCREEN_HEIGHT + length, { duration, easing: Easing.linear }),
        -1,
        false
      )
    );
    return () => cancelAnimation(translateY);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.dropWrapper,
        {
          left: `${leftPercent}%`,
          width: thickness,
          height: length,
          backgroundColor: color,
          borderRadius: thickness / 2,
          opacity,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
}

export function generateDrops(count) {
  const drops = [];
  for (let i = 0; i < count; i++) {
    const duration = 1100 + Math.random() * 700;
    drops.push({
      leftPercent: Math.random() * 100,
      length: 14 + Math.random() * 12,
      thickness: 1.8 + Math.random() * 1.2,
      duration,
      delay: Math.random() * duration,
      opacity: 0.45 + Math.random() * 0.4,
    });
  }
  return drops;
}

export default function RainAnimation({ intensity = 1 }) {
  const tinted = useMemo(
    () => CLOUD_TEMPLATES.map((t) => tintDarkCloudSvg(t, DARK_CLOUD_COLOR)),
    []
  );
  const drops = useMemo(() => generateDrops(Math.round(22 * intensity)), [intensity]);

  return (
    <View style={styles.container} pointerEvents="none">
      <DarkCloud topPercent={2}  size={220} duration={28000} delay={0}     opacity={0.85} tintedSvg={tinted[0]} />
      <DarkCloud topPercent={8}  size={170} duration={32000} delay={6000}  opacity={0.75} tintedSvg={tinted[1]} />
      <DarkCloud topPercent={5}  size={195} duration={26000} delay={12000} opacity={0.80} tintedSvg={tinted[3]} />

      {drops.map((d, i) => (
        <Raindrop
          key={i}
          leftPercent={d.leftPercent}
          length={d.length}
          thickness={d.thickness}
          duration={d.duration}
          delay={d.delay}
          opacity={d.opacity}
          color={RAIN_COLOR}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  cloudWrapper: {
    position: 'absolute',
  },
  dropWrapper: {
    position: 'absolute',
    top: 0,
  },
});