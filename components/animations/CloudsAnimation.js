// components/animations/CloudsAnimation.js
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Базовий бежево-сірий — у тон палітри додатку
const CLOUD_COLOR = '#9A8F7E';

// --- Зсунути яскравість HEX ---
function shiftColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// Замінити плейсхолдери в SVG на похідні від baseColor.
// 4 рівні яскравості зберігають оригінальну градацію хмар (підсвітка/тіло/тінь),
// але переводять їх в бежеву палітру.
function tintCloudSvg(svg, baseColor) {
  const c1 = shiftColor(baseColor, 60); // найсвітліша — верхня підсвітка
  const c4 = shiftColor(baseColor, 50); // акцент (тільки в одній з хмар)
  const c2 = shiftColor(baseColor, 35); // основне тіло
  const c3 = shiftColor(baseColor, 10); // нижня тінь
  return svg
    .replace(/__C1__/g, c1)
    .replace(/__C2__/g, c2)
    .replace(/__C3__/g, c3)
    .replace(/__C4__/g, c4);
}

const CLOUD_TEMPLATES = [CLOUD_1, CLOUD_2, CLOUD_3, CLOUD_4];

// --- Одна хмара, що пливе зліва направо ---
function MovingCloud({ topPercent, size, duration, delay, opacity, tintedSvg }) {
  const translateX = useSharedValue(-size);

  useEffect(() => {
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(SCREEN_WIDTH + size, {
          duration,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );
    return () => cancelAnimation(translateX);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // viewBox SVG — 2000×2000, але хмара займає ~85% висоти.
  // Тому реальна висота меньша за size, висота = size * 0.85.
  return (
    <Animated.View
      style={[
        styles.cloudWrapper,
        { top: `${topPercent}%`, opacity },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <SvgXml xml={tintedSvg} width={size} height={size * 0.85} />
    </Animated.View>
  );
}

// --- 5 хмар: різні шаблони, розміри, швидкості ---
export default function CloudsAnimation({ color = CLOUD_COLOR, intensity = 1 }) {
  const baseOpacity = 0.7 + 0.2 * intensity;

  // Перефарбовуємо 4 шаблони один раз і запам'ятовуємо результат.
  // useMemo гарантує, що це зробиться лише при зміні color.
  const tinted = useMemo(
    () => CLOUD_TEMPLATES.map((t) => tintCloudSvg(t, color)),
    [color]
  );

  return (
    <View style={styles.container} pointerEvents="none">
      <MovingCloud
        topPercent={6}
        size={200}
        duration={14000}
        delay={0}
        opacity={baseOpacity}
        tintedSvg={tinted[0]}
      />
      <MovingCloud
        topPercent={24}
        size={150}
        duration={17000}
        delay={3500}
        opacity={baseOpacity - 0.05}
        tintedSvg={tinted[1]}
      />
      <MovingCloud
        topPercent={42}
        size={120}
        duration={13000}
        delay={7000}
        opacity={baseOpacity - 0.1}
        tintedSvg={tinted[2]}
      />
      <MovingCloud
        topPercent={56}
        size={180}
        duration={19000}
        delay={5000}
        opacity={baseOpacity - 0.05}
        tintedSvg={tinted[3]}
      />
      <MovingCloud
        topPercent={74}
        size={135}
        duration={15000}
        delay={10000}
        opacity={baseOpacity - 0.08}
        tintedSvg={tinted[0]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden', // ← обрізає хмари межами свого міста
  },
  cloudWrapper: { position: 'absolute' },
});