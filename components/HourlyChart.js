// HourlyChart.js
// Apple Weather-стиль графіка погодинної температури.
// Показує наступні ~24 години як плавну криву з 8 точок (поточна + 7 прогнозних).
// Дані з OWM /forecast endpoint мають крок 3 години, тож 7 точок ≈ 21 год.
//
// Стиль (фон/текст/радіус/шрифти) береться з ThemeContext + styles/theme,
// тому плашка автоматично виглядає як WeatherDetails / ForecastList.
// Колір кривої можна override-нути через prop `curveColor` (для адаптації
// під погоду — див. utils/weatherPalette).

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { fonts, radius } from '../styles/theme';

// ────────────────────────────────────────────────────────────
// Константи розкладки
// ────────────────────────────────────────────────────────────
const POINT_COUNT = 8;
const SVG_HEIGHT = 200;
const CURVE_AREA_TOP = 32;
const CURVE_AREA_BOTTOM = 130;
const TEMP_LABEL_OFFSET = 22;
const ICONS_TOP = 138;
const TIMES_TOP = 168;

// Дефолтний колір кривої — теплий помаранчевий. Override через prop `curveColor`.
const DEFAULT_CURVE_COLOR = '#D08247';

// ────────────────────────────────────────────────────────────
// Мапінг OWM-кодів іконок → emoji
// ────────────────────────────────────────────────────────────
const ICON_EMOJI = {
  '01d': '☀️',  '01n': '🌙',
  '02d': '🌤️', '02n': '☁️',
  '03d': '☁️',  '03n': '☁️',
  '04d': '☁️',  '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️',
  '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️',
  '13d': '❄️', '13n': '❄️',
  '50d': '🌫️', '50n': '🌫️',
};
const iconToEmoji = (code) => ICON_EMOJI[code] || '☀️';

const formatTime = (unixSeconds) => {
  const date = new Date(unixSeconds * 1000);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

// Catmull-Rom → Cubic Bezier для плавної кривої
const buildSmoothPath = (points) => {
  if (points.length < 2) return '';
  const parts = [`M ${points[0].x} ${points[0].y}`];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || points[i + 1];

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    parts.push(
      `C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x} ${p2.y}`
    );
  }

  return parts.join(' ');
};

// ────────────────────────────────────────────────────────────
// Основний компонент
// ────────────────────────────────────────────────────────────
const HourlyChart = ({
  current,
  forecast,
  title = 'Наступні 24 години',
  nowLabel = 'Зараз',
  curveColor = DEFAULT_CURVE_COLOR,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [innerWidth, setInnerWidth] = useState(0);

  const dataPoints = useMemo(() => {
    if (!current || !forecast || forecast.length < 7) return null;
    return [
      {
        temp: Math.round(current.main.temp),
        icon: current.weather[0].icon,
        label: nowLabel,
      },
      ...forecast.slice(0, 7).map((f) => ({
        temp: Math.round(f.main.temp),
        icon: f.weather[0].icon,
        label: formatTime(f.dt),
      })),
    ];
  }, [current, forecast, nowLabel]);

  const points = useMemo(() => {
    if (!dataPoints || innerWidth === 0) return null;

    const temps = dataPoints.map((d) => d.temp);
    const minT = Math.min(...temps);
    const maxT = Math.max(...temps);
    const range = maxT - minT;

    const yTop = CURVE_AREA_TOP + 20;
    const yBottom = CURVE_AREA_BOTTOM - 8;
    const yRange = yBottom - yTop;

    return dataPoints.map((d, i) => {
      const x = (innerWidth * i) / (POINT_COUNT - 1);
      const y =
        range === 0
          ? (yTop + yBottom) / 2
          : yBottom - ((d.temp - minT) / range) * yRange;
      return { x, y, temp: d.temp, icon: d.icon, label: d.label };
    });
  }, [dataPoints, innerWidth]);

  if (!dataPoints) return null;

  const linePath = points ? buildSmoothPath(points) : '';
  const fillPath =
    points && points.length
      ? `${linePath} L ${points[points.length - 1].x} ${CURVE_AREA_BOTTOM} L ${points[0].x} ${CURVE_AREA_BOTTOM} Z`
      : '';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <View
        style={styles.chartContainer}
        onLayout={(e) => setInnerWidth(e.nativeEvent.layout.width)}
      >
        {points && (
          <>
            <Svg width={innerWidth} height={SVG_HEIGHT}>
              <Defs>
                <LinearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={curveColor} stopOpacity="0.35" />
                  <Stop offset="1" stopColor={curveColor} stopOpacity="0" />
                </LinearGradient>
              </Defs>

              <Path d={fillPath} fill="url(#tempFill)" />

              <Path
                d={linePath}
                fill="none"
                stroke={curveColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {points.map((p, i) => (
                <Circle
                  key={`dot-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r="3.5"
                  fill={colors.text}
                />
              ))}
            </Svg>

            {points.map((p, i) => (
              <Text
                key={`temp-${i}`}
                style={[
                  styles.tempLabel,
                  { left: p.x - 22, top: p.y - TEMP_LABEL_OFFSET },
                ]}
              >
                {p.temp}°
              </Text>
            ))}

            {points.map((p, i) => (
              <Text
                key={`icon-${i}`}
                style={[
                  styles.iconLabel,
                  { left: p.x - 14, top: ICONS_TOP },
                ]}
              >
                {iconToEmoji(p.icon)}
              </Text>
            ))}

            {points.map((p, i) => (
              <Text
                key={`time-${i}`}
                style={[
                  i === 0 ? styles.timeLabelNow : styles.timeLabel,
                  { left: p.x - 22, top: TIMES_TOP },
                ]}
              >
                {p.label}
              </Text>
            ))}
          </>
        )}
      </View>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.detailsBackground,
      borderRadius: radius.xlarge,
      paddingHorizontal: 18,
      paddingTop: 14,
      paddingBottom: 16,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.textLight,
      marginBottom: 18,
    },
    chartContainer: {
      width: '100%',
      height: SVG_HEIGHT,
      position: 'relative',
    },
    tempLabel: {
      position: 'absolute',
      width: 44,
      textAlign: 'center',
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.text,
    },
    iconLabel: {
      position: 'absolute',
      width: 28,
      fontSize: 18,
      textAlign: 'center',
    },
    timeLabel: {
      position: 'absolute',
      width: 44,
      textAlign: 'center',
      fontSize: 11,
      fontFamily: fonts.regular,
      color: colors.textLight,
    },
    timeLabelNow: {
      position: 'absolute',
      width: 44,
      textAlign: 'center',
      fontSize: 11,
      fontFamily: fonts.bold,
      color: colors.text,
    },
  });

export default HourlyChart;