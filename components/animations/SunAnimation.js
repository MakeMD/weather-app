// components/animations/SunAnimation.js
import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { SvgXml } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Дефолт: тепла охра, узгоджується з беж-палітрою.
// Якщо palette.sun передано — буде override через prop.
const DEFAULT_SUN_COLOR = '#FFD27A';

const SUN_SIZE = SCREEN_WIDTH * 0.42;
const TOP_OFFSET_PERCENT = 4;
const RIGHT_OFFSET_PERCENT = 4;

function shiftColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function buildRaysSvg(baseColor) {
  const body = baseColor;
  const highlight = shiftColor(baseColor, 30);

  const parts = [];
  for (let i = 0; i < 12; i++) {
    const angle = i * 30;
    parts.push(
      `<path d="M 96 58 Q 100 56 104 58 L 100 16 Z" fill="${body}" transform="rotate(${angle} 100 100)"/>`
    );
    parts.push(
      `<path d="M 96 58 Q 98 57 100 57 L 100 16 Z" fill="${highlight}" transform="rotate(${angle} 100 100)"/>`
    );
  }

  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`;
}

function buildDiskSvg(baseColor) {
  const shadow = shiftColor(baseColor, -25);
  const body = baseColor;
  const highlight = shiftColor(baseColor, 30);

  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="103" r="38" fill="${shadow}"/>
    <circle cx="100" cy="100" r="38" fill="${body}"/>
    <ellipse cx="91" cy="89" rx="18" ry="13" fill="${highlight}"/>
  </svg>`;
}

export default function SunAnimation({ color = DEFAULT_SUN_COLOR }) {
  const rotate = useSharedValue(0);

  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(360, { duration: 60000, easing: Easing.linear }),
      -1,
      false
    );
    return () => cancelAnimation(rotate);
  }, []);

  const raysStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  // Регенерація SVG лише при зміні color (наприклад при переключенні теми)
  const raysSvg = useMemo(() => buildRaysSvg(color), [color]);
  const diskSvg = useMemo(() => buildDiskSvg(color), [color]);

  return (
    <View style={styles.container} pointerEvents="none">
      <View
        style={[
          styles.sunWrapper,
          {
            top: `${TOP_OFFSET_PERCENT}%`,
            right: `${RIGHT_OFFSET_PERCENT}%`,
            width: SUN_SIZE,
            height: SUN_SIZE,
          },
        ]}
      >
        <Animated.View style={[styles.layer, raysStyle]}>
          <SvgXml xml={raysSvg} width={SUN_SIZE} height={SUN_SIZE} />
        </Animated.View>

        <View style={styles.layer}>
          <SvgXml xml={diskSvg} width={SUN_SIZE} height={SUN_SIZE} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  sunWrapper: {
    position: 'absolute',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
});