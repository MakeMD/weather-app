// components/animations/ThunderstormAnimation.js
import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { SvgXml } from 'react-native-svg';
import {
  DarkCloud,
  Raindrop,
  generateDrops,
  tintDarkCloudSvg,
  CLOUD_TEMPLATES,
  RAIN_COLOR,
} from './RainAnimation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Дефолти на випадок виклику без props
const DEFAULT_STORM_CLOUD_COLOR = '#4A4339';

// Блискавка та flash overlay — завжди білі (фізичний феномен).
// Не виносимо в палітру, бо це не aesthetic choice.
const LIGHTNING_COLOR = '#ffffff';

// Пауза між блискавками (для діагностики можна тимчасово 1500-3000)
const PAUSE_MIN = 4000;
const PAUSE_MAX = 9000;

const LIGHTNING_SVG = `<svg viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg">
  <g fill="${LIGHTNING_COLOR}">
    <polygon points="55,0 30,90 60,90 25,200 75,80 45,80 70,0" />
    <polygon points="40,75 25,110 38,108 30,150 50,100 38,100 48,75" opacity="0.7" />
  </g>
</svg>`;

const LIGHTNING_WIDTH = SCREEN_WIDTH * 0.35;
const LIGHTNING_HEIGHT = SCREEN_HEIGHT * 0.5;

// --- Спалах: світлий прямокутник на повний екран ---
function FlashOverlay() {
  const opacity = useSharedValue(0);
  const timeoutRef = useRef(null);
  const isAliveRef = useRef(true);

  useEffect(() => {
    isAliveRef.current = true;

    function scheduleNext() {
      if (!isAliveRef.current) return;

      const pause = PAUSE_MIN + Math.random() * (PAUSE_MAX - PAUSE_MIN);
      const isDouble = Math.random() < 0.4;

      timeoutRef.current = setTimeout(() => {
        if (!isAliveRef.current) return;

        opacity.value = withSequence(
          withTiming(0.85, { duration: 60, easing: Easing.linear }),
          withTiming(0, { duration: 250, easing: Easing.out(Easing.quad) }),
          ...(isDouble
            ? [
                withDelay(80, withTiming(0.55, { duration: 50, easing: Easing.linear })),
                withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) }),
              ]
            : [])
        );

        scheduleNext();
      }, pause);
    }

    scheduleNext();

    return () => {
      isAliveRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      cancelAnimation(opacity);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[styles.flashOverlay, animatedStyle]}
      pointerEvents="none"
    />
  );
}

// --- Зигзаг блискавки ---
function LightningBolt() {
  const opacity = useSharedValue(0);
  const positionX = useSharedValue(0);
  const timeoutRef = useRef(null);
  const isAliveRef = useRef(true);

  useEffect(() => {
    isAliveRef.current = true;

    function scheduleNext() {
      if (!isAliveRef.current) return;

      const pause = PAUSE_MIN + Math.random() * (PAUSE_MAX - PAUSE_MIN);
      const newX = (0.1 + Math.random() * 0.6) * SCREEN_WIDTH;

      timeoutRef.current = setTimeout(() => {
        if (!isAliveRef.current) return;

        positionX.value = newX;
        opacity.value = withSequence(
          withTiming(1, { duration: 30, easing: Easing.linear }),
          withDelay(150, withTiming(0, { duration: 100, easing: Easing.out(Easing.quad) }))
        );

        scheduleNext();
      }, pause);
    }

    scheduleNext();

    return () => {
      isAliveRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      cancelAnimation(opacity);
      cancelAnimation(positionX);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: positionX.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.lightningWrapper,
        { width: LIGHTNING_WIDTH, height: LIGHTNING_HEIGHT },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <SvgXml xml={LIGHTNING_SVG} width={LIGHTNING_WIDTH} height={LIGHTNING_HEIGHT} />
    </Animated.View>
  );
}

export default function ThunderstormAnimation({
  intensity = 1.2,
  cloudColor = DEFAULT_STORM_CLOUD_COLOR,
  dropColor = RAIN_COLOR,
}) {
  // useMemo тепер залежить від cloudColor — хмари перефарбуються при зміні палітри
  const tinted = useMemo(
    () => CLOUD_TEMPLATES.map((t) => tintDarkCloudSvg(t, cloudColor)),
    [cloudColor]
  );
  const drops = useMemo(() => generateDrops(Math.round(28 * intensity)), [intensity]);

  return (
    <View style={styles.container} pointerEvents="none">
      <DarkCloud topPercent={1}  size={240} duration={26000} delay={0}     opacity={0.92} tintedSvg={tinted[0]} />
      <DarkCloud topPercent={6}  size={185} duration={30000} delay={5000}  opacity={0.85} tintedSvg={tinted[1]} />
      <DarkCloud topPercent={3}  size={210} duration={24000} delay={10000} opacity={0.88} tintedSvg={tinted[3]} />

      {drops.map((d, i) => (
        <Raindrop
          key={i}
          leftPercent={d.leftPercent}
          length={d.length}
          thickness={d.thickness}
          duration={d.duration}
          delay={d.delay}
          opacity={d.opacity}
          color={dropColor}
        />
      ))}

      <LightningBolt />
      <FlashOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
  },
  lightningWrapper: {
    position: 'absolute',
    top: '5%',
    left: 0,
  },
});