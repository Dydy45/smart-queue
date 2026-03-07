// DaisyUI Valentine theme colors
// Source: https://daisyui.com/docs/themes/

export const VALENTINE_COLORS = {
  // Primary colors
  primary: "#e96d7b",
  primaryFocus: "#df536a",
  primaryContent: "#ffffff",
  
  // Secondary colors
  secondary: "#a991f7",
  secondaryFocus: "#9178f4",
  secondaryContent: "#ffffff",
  
  // Accent colors
  accent: "#88dbdd",
  accentFocus: "#6fd4d7",
  accentContent: "#1f2937",
  
  // Neutral colors
  neutral: "#af4670",
  neutralFocus: "#a03e65",
  neutralContent: "#ffffff",
  
  // Base colors
  base100: "#ffffff",
  base200: "#f9fafb",
  base300: "#f3f4f6",
  baseContent: "#1f2937",
  
  // State colors
  info: "#3abff8",
  infoContent: "#002b3d",
  success: "#36d399",
  successContent: "#003320",
  warning: "#fbbd23",
  warningContent: "#382800",
  error: "#f87272",
  errorContent: "#470000",
};

// Gradient backgrounds for intro/outro
export const VALENTINE_GRADIENTS = {
  primary: `linear-gradient(135deg, ${VALENTINE_COLORS.primary}, ${VALENTINE_COLORS.secondary}, ${VALENTINE_COLORS.accent})`,
  soft: `linear-gradient(135deg, #fce7f3, #f3e8ff, #dbeafe)`,
};

// Text colors
export const TEXT_COLORS = {
  dark: VALENTINE_COLORS.baseContent,
  light: VALENTINE_COLORS.primaryContent,
  muted: "#64748b",
  accent: VALENTINE_COLORS.primary,
};

// Background colors
export const BG_COLORS = {
  page: VALENTINE_COLORS.base200,
  card: VALENTINE_COLORS.base100,
  hover: VALENTINE_COLORS.base300,
};

// Border colors
export const BORDER_COLORS = {
  default: "#e5e7eb",
  focus: VALENTINE_COLORS.primary,
  muted: "#f3f4f6",
};
