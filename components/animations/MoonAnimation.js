// components/animations/MoonAnimation.js
// Місяць оживляють два ефекти:
//   1. Halo — м'яке сяйво навколо, пульсує opacity (0.3 → 0.55).
//   2. Drift — весь wrapper повільно піднімається/опускається на ±5px.
// Обидва ефекти дуже повільні (10 і 16 секунд) — користувач не помічає
// руху прямо, але сцена відчувається живою.
import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { SvgXml } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const DEFAULT_MOON_COLOR = '#E8E4D5';
const STAR_COLOR = '#FFFFFF'; // зорі завжди білі — фізичний атрибут "зоряності"

const MOON_SIZE = SCREEN_WIDTH * 0.32;
const HALO_SIZE = MOON_SIZE * 1.6;       // halo на 60% більший за місяць
const HALO_OFFSET = (HALO_SIZE - MOON_SIZE) / 2; // зсув щоб halo був центрований навколо місяця

const TOP_OFFSET_PERCENT = 6;
const RIGHT_OFFSET_PERCENT = 8;

// Параметри "життя"
const HALO_PULSE_DURATION = 5000;   // напівцикл; повне дихання 10 сек
const HALO_OPACITY_MIN = 0.30;
const HALO_OPACITY_MAX = 0.55;

const DRIFT_DURATION = 8000;        // напівцикл; повний цикл 16 сек
const DRIFT_AMOUNT = 30;             // px ±

function shiftColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function buildMoonSvg(baseColor) {
  const shadow = shiftColor(baseColor, -45);
  const body = baseColor;
  const crater = shiftColor(baseColor, -22);
  const highlight = shiftColor(baseColor, 15);

  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="103" r="58" fill="${shadow}" opacity="0.3"/>
    <circle cx="100" cy="100" r="58" fill="${body}"/>
    <ellipse cx="86" cy="82" rx="22" ry="16" fill="${highlight}"/>
    <circle cx="118" cy="92" r="7" fill="${crater}" opacity="0.55"/>
    <circle cx="92" cy="118" r="10" fill="${crater}" opacity="0.45"/>
    <circle cx="125" cy="125" r="5" fill="${crater}" opacity="0.5"/>
    <circle cx="75" cy="100" r="4" fill="${crater}" opacity="0.4"/>
  </svg>`;
}

// Halo — radial gradient від кольору місяця до прозорого.
// 3 stops: яскравіше в центрі, м'якше на краях.
function buildHaloSvg(baseColor) {
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="halo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${baseColor}" stop-opacity="0.8"/>
        <stop offset="35%" stop-color="${baseColor}" stop-opacity="0.4"/>
        <stop offset="70%" stop-color="${baseColor}" stop-opacity="0.1"/>
        <stop offset="100%" stop-color="${baseColor}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="100" cy="100" r="100" fill="url(#halo)"/>
  </svg>`;
}

function Star({ leftPercent, topPercent, size, twinkleDuration, twinkleDelay, baseOpacity }) {
  const opacity = useSharedValue(baseOpacity);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(
      twinkleDelay,
      withRepeat(
        withTiming(baseOpacity * 0.4, { duration: twinkleDuration, easing: Easing.inOut(Easing.sin) }),
        -1, true
      )
    );
    scale.value = withDelay(
      twinkleDelay,
      withRepeat(
        withTiming(0.7, { duration: twinkleDuration, easing: Easing.inOut(Easing.sin) }),
        -1, true
      )
    );
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(scale);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: `${leftPercent}%`,
          top: `${topPercent}%`,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: STAR_COLOR,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
}

function generateStars(count) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      leftPercent: Math.random() * 100,
      topPercent: Math.random() * 70,
      size: 1.5 + Math.random() * 2.5,
      twinkleDuration: 1500 + Math.random() * 2500,
      twinkleDelay: Math.random() * 3000,
      baseOpacity: 0.55 + Math.random() * 0.45,
    });
  }
  return stars;
}

function ShootingStar() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) }),
        withDelay(9000, withTiming(0, { duration: 0 }))
      ),
      -1, false
    );
    return () => cancelAnimation(progress);
  }, []);

  const startX = SCREEN_WIDTH * 0.85;
  const startY = SCREEN_HEIGHT * 0.1;
  const endX = SCREEN_WIDTH * 0.35;
  const endY = SCREEN_HEIGHT * 0.5;

  const animatedStyle = useAnimatedStyle(() => {
    const x = startX + (endX - startX) * progress.value;
    const y = startY + (endY - startY) * progress.value;
    const visible = progress.value > 0.01 && progress.value < 0.99 ? 1 : 0;
    return {
      transform: [{ translateX: x }, { translateY: y }],
      opacity: visible,
    };
  });

  return (
    <Animated.View style={[styles.shootingStarWrapper, animatedStyle]} pointerEvents="none">
      <View style={styles.shootingTail} />
      <View style={styles.shootingHead} />
    </Animated.View>
  );
}

export default function MoonAnimation({ color = DEFAULT_MOON_COLOR }) {
  const moonSvg = useMemo(() => buildMoonSvg(color), [color]);
  const haloSvg = useMemo(() => buildHaloSvg(color), [color]);
  const stars = useMemo(() => generateStars(40), []);

  // Shared values для двох ефектів
  const haloOpacity = useSharedValue(HALO_OPACITY_MIN);
  const driftY = useSharedValue(-DRIFT_AMOUNT);

  useEffect(() => {
    // Halo: opacity дихає від MIN до MAX, sin-easing, реверс — туди-назад
    haloOpacity.value = withRepeat(
      withTiming(HALO_OPACITY_MAX, {
        duration: HALO_PULSE_DURATION,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    // Drift: translateY -DRIFT_AMOUNT ↔ +DRIFT_AMOUNT, теж реверс
    driftY.value = withRepeat(
      withTiming(DRIFT_AMOUNT, {
        duration: DRIFT_DURATION,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    return () => {
      cancelAnimation(haloOpacity);
      cancelAnimation(driftY);
    };
  }, []);

  // Drift застосовується до всього wrapper (halo + moon рухаються разом)
  const driftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: driftY.value }],
  }));

  // Halo opacity — окремо
  const haloAnimStyle = useAnimatedStyle(() => ({
    opacity: haloOpacity.value,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {stars.map((s, i) => <Star key={i} {...s} />)}
      <ShootingStar />

      <Animated.View
        style={[
          styles.moonWrapper,
          {
            top: `${TOP_OFFSET_PERCENT}%`,
            right: `${RIGHT_OFFSET_PERCENT}%`,
            width: MOON_SIZE,
            height: MOON_SIZE,
          },
          driftStyle,
        ]}
      >
        {/* Halo — позаду місяця, центрований відносно нього */}
        <Animated.View
          style={[
            styles.halo,
            {
              width: HALO_SIZE,
              height: HALO_SIZE,
              top: -HALO_OFFSET,
              left: -HALO_OFFSET,
            },
            haloAnimStyle,
          ]}
          pointerEvents="none"
        >
          <SvgXml xml={haloSvg} width={HALO_SIZE} height={HALO_SIZE} />
        </Animated.View>

        {/* Сам місяць — зверху halo */}
        <SvgXml xml={moonSvg} width={MOON_SIZE} height={MOON_SIZE} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  moonWrapper: { position: 'absolute' },
  halo: { position: 'absolute' },
  star: { position: 'absolute' },
  shootingStarWrapper: { position: 'absolute', top: 0, left: 0, width: 4, height: 4 },
  shootingHead: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF', shadowOpacity: 0.8, shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
  },
  shootingTail: {
    position: 'absolute',
    width: 50, height: 1.5,
    backgroundColor: '#FFFFFF', opacity: 0.5,
    transform: [{ rotate: '-30deg' }, { translateX: 25 }],
  },
});