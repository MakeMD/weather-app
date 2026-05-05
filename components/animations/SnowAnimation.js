// components/animations/SnowAnimation.js
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Майже білий з ледь холодним відтінком — читається на будь-якому фоні
const SNOW_COLOR = '#F8FAFC';

// SVG-кристал: 3 наскрізні лінії = 6 променів + дрібні «гачки» на верх/низ
const SNOWFLAKE_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <g stroke="${SNOW_COLOR}" stroke-width="1.4" stroke-linecap="round" fill="none">
    <line x1="12" y1="3" x2="12" y2="21" />
    <line x1="4.2" y1="7.5" x2="19.8" y2="16.5" />
    <line x1="4.2" y1="16.5" x2="19.8" y2="7.5" />
    <path d="M 12 6 L 10 4 M 12 6 L 14 4" />
    <path d="M 12 18 L 10 20 M 12 18 L 14 20" />
  </g>
</svg>`;

// --- Маленька кругла крупинка снігу ---
function SnowDot({
  leftPercent, size, fallDuration, fallDelay,
  swayDuration, swayDelay, swayAmount, opacity,
}) {
  const translateY = useSharedValue(-size);
  const translateX = useSharedValue(0);

  useEffect(() => {
    // Падіння: лінійне, циклічне, без реверсу
    translateY.value = withDelay(
      fallDelay,
      withRepeat(
        withTiming(SCREEN_HEIGHT + size, {
          duration: fallDuration,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );
    // Гойдання вліво-вправо: синусоїдальне (Easing.sin), з реверсом (true)
    translateX.value = withDelay(
      swayDelay,
      withRepeat(
        withTiming(swayAmount, {
          duration: swayDuration,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
    return () => {
      cancelAnimation(translateY);
      cancelAnimation(translateX);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.flakeWrapper,
        {
          left: `${leftPercent}%`,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: SNOW_COLOR,
          opacity,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
}

// --- Кристалоподібна сніжинка з обертанням ---
function SnowCrystal({
  leftPercent, size, fallDuration, fallDelay,
  swayDuration, swayDelay, swayAmount,
  rotateDuration, opacity,
}) {
  const translateY = useSharedValue(-size);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      fallDelay,
      withRepeat(
        withTiming(SCREEN_HEIGHT + size, {
          duration: fallDuration,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );
    translateX.value = withDelay(
      swayDelay,
      withRepeat(
        withTiming(swayAmount, {
          duration: swayDuration,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
    // Обертання: 360° за rotateDuration, без реверсу — крутиться в один бік
    rotate.value = withRepeat(
      withTiming(360, {
        duration: rotateDuration,
        easing: Easing.linear,
      }),
      -1,
      false
    );
    return () => {
      cancelAnimation(translateY);
      cancelAnimation(translateX);
      cancelAnimation(rotate);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.flakeWrapper,
        { left: `${leftPercent}%`, width: size, height: size, opacity },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <SvgXml xml={SNOWFLAKE_SVG} width={size} height={size} />
    </Animated.View>
  );
}

// Згенерувати параметри один раз — useMemo гарантує стабільність між ре-рендерами
function generateFlakes(count) {
  const flakes = [];
  for (let i = 0; i < count; i++) {
    const isCrystal = Math.random() < 0.25; // 25% — великі кристали
    const fallDuration = 4500 + Math.random() * 3000; // 4.5–7.5 сек на падіння
    flakes.push({
      isCrystal,
      leftPercent: Math.random() * 100,
      size: isCrystal
        ? 14 + Math.random() * 8   // 14–22 px кристал
        : 3 + Math.random() * 5,   // 3–8 px крупинка
      fallDuration,
      fallDelay: Math.random() * fallDuration, // фаза в циклі — для рівномірного заповнення
      swayDuration: 2000 + Math.random() * 2500, // 2–4.5 сек гойдання
      swayDelay: Math.random() * 2000,
      swayAmount: (Math.random() - 0.5) * 50,    // ±25 px бічного зсуву
      rotateDuration: 4000 + Math.random() * 4000, // 4–8 сек повний оберт
      opacity: 0.6 + Math.random() * 0.35,
    });
  }
  return flakes;
}

export default function SnowAnimation({ intensity = 1 }) {
  // 35 сніжинок при intensity=1, ~52 при intensity=1.5 (сильний снігопад)
  const flakes = useMemo(
    () => generateFlakes(Math.round(35 * intensity)),
    [intensity]
  );

  return (
    <View style={styles.container} pointerEvents="none">
      {flakes.map((f, i) =>
        f.isCrystal ? <SnowCrystal key={i} {...f} /> : <SnowDot key={i} {...f} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  flakeWrapper: {
    position: 'absolute',
    top: 0,
  },
});