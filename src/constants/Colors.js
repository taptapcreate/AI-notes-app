// Theme colors for Light and Dark mode
// Purple/Violet theme with clean gradients

export const DarkTheme = {
  mode: 'dark',

  // Primary - Violet/Purple
  primary: '#8B5CF6',
  primaryDark: '#7C3AED',
  primaryLight: '#A78BFA',

  // Secondary - Sky Blue
  secondary: '#0EA5E9',
  secondaryDark: '#0284C7',

  // Accent - Emerald
  accent: '#10B981',
  accentLight: '#34D399',

  // Clean 2-stop gradients (softer than 3-stop)
  gradientPrimary: ['#7C3AED', '#A78BFA'],
  gradientSecondary: ['#0284C7', '#38BDF8'],
  gradientAccent: ['#059669', '#34D399'],

  // Background - Dark Slate
  background: '#0F172A',
  surface: '#1E293B',
  surfaceLight: '#334155',
  elevated: '#1E293B',

  // Text
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  // Status
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  glassBackground: 'rgba(30, 41, 59, 0.8)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',

  // Status bar
  statusBar: 'light',
};

export const LightTheme = {
  mode: 'light',

  // Primary - Violet/Purple
  primary: '#7C3AED',
  primaryDark: '#6D28D9',
  primaryLight: '#8B5CF6',

  // Secondary - Sky Blue
  secondary: '#0284C7',
  secondaryDark: '#0369A1',

  // Accent - Emerald
  accent: '#059669',
  accentLight: '#10B981',

  // Clean 2-stop gradients
  gradientPrimary: ['#6D28D9', '#8B5CF6'],
  gradientSecondary: ['#0369A1', '#0EA5E9'],
  gradientAccent: ['#047857', '#10B981'],

  // Background - Clean White/Gray
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceLight: '#F1F5F9',
  elevated: '#FFFFFF',

  // Text
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',

  // Status
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Overlay
  overlay: 'rgba(15, 23, 42, 0.4)',
  glassBackground: 'rgba(255, 255, 255, 0.9)',
  glassBorder: 'rgba(0, 0, 0, 0.05)',

  // Status bar
  statusBar: 'dark',
};

// Default export for backward compatibility
export default DarkTheme;
