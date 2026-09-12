/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';

// B-Fit is a dark-only app (see SPEC: "the whole app uses a dark theme").
export function useTheme() {
  return Colors.dark;
}
