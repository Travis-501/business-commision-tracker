import { useColorScheme as useColorSchemeCore } from 'react-native';

import { useThemePreference } from '@/src/context/ThemeContext';

export const useColorScheme = () => {
  const { theme } = useThemePreference();
  const coreScheme = useColorSchemeCore();
  const resolvedScheme = coreScheme === 'unspecified' ? 'light' : coreScheme;

  return theme ?? resolvedScheme;
};
