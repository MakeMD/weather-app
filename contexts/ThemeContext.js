import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import { lightColors, darkColors } from '../styles/theme';

// Named export — потрібен щоб місцями (наприклад в App.js) можна було
// тимчасово override-нути значення через <ThemeContext.Provider>.
export const ThemeContext = createContext(null);

export function ThemeProvider({ preference = 'auto', children }) {
  const [systemScheme, setSystemScheme] = useState(() => Appearance.getColorScheme());

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);

  const value = useMemo(() => {
    let scheme;
    if (preference === 'light' || preference === 'dark') {
      scheme = preference;
    } else {
      scheme = systemScheme === 'dark' ? 'dark' : 'light';
    }
    const colors = scheme === 'dark' ? darkColors : lightColors;
    return { colors, scheme, preference };
  }, [preference, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return { colors: lightColors, scheme: 'light', preference: 'auto' };
  }
  return ctx;
}