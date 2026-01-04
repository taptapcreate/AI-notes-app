// Theme colors for Light and Dark mode

export const DarkTheme = {
  mode: 'dark',

  // Primary gradient colors
  primary: '#8b5cf6', // Violet
  primaryDark: '#7c3aed',
  primaryLight: '#a78bfa',

  // Secondary  
  secondary: '#0ea5e9', // Sky Blue
  secondaryDark: '#0284c7',

  // Accent colors
  accent: '#10b981', // Emerald
  accentLight: '#34d399',

  // Gradient pairs (Modern, rich 3-stop gradients)
  gradientPrimary: ['#6366f1', '#8b5cf6', '#d946ef'], // Indigo -> Violet -> Fuchsia (Vibrant)
  gradientSecondary: ['#3b82f6', '#0ea5e9', '#38bdf8'], // Blue -> Sky -> Light Sky (Cool/Trust)
  gradientAccent: ['#10b981', '#14b8a6', '#06b6d4'], // Emerald -> Teal -> Cyan (Fresh)

  // Background (Deep "Midnight" Slate)
  background: '#0f172a',
  surface: '#1e293b',
  surfaceLight: '#334155',
  elevated: '#1e293b',

  // Text
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',

  // Status
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  glassBackground: 'rgba(30, 41, 59, 0.7)', // Frosted slate
  glassBorder: 'rgba(255, 255, 255, 0.08)',

  // Status bar
  statusBar: 'light',
};

export const LightTheme = {
  mode: 'light',

  // Primary gradient colors
  primary: '#7c3aed',
  primaryDark: '#6d28d9',
  primaryLight: '#a78bfa',

  // Secondary  
  secondary: '#0284c7',
  secondaryDark: '#0369a1',

  // Accent colors
  accent: '#059669',
  accentLight: '#10b981',

  // Gradient pairs
  gradientPrimary: ['#6366f1', '#8b5cf6', '#d946ef'], // Same vibrant gradients
  gradientSecondary: ['#3b82f6', '#0ea5e9', '#38bdf8'],
  gradientAccent: ['#10b981', '#14b8a6', '#06b6d4'],

  // Background
  background: '#f8fafc', // Slate 50
  surface: '#ffffff',
  surfaceLight: '#f1f5f9', // Slate 100
  elevated: '#ffffff',

  // Text
  text: '#0f172a', // Slate 900
  textSecondary: '#475569', // Slate 600
  textMuted: '#94a3b8', // Slate 400

  // Status
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',

  // Overlay
  overlay: 'rgba(15, 23, 42, 0.4)',
  glassBackground: 'rgba(255, 255, 255, 0.8)',
  glassBorder: 'rgba(255, 255, 255, 0.5)',

  // Status bar
  statusBar: 'dark',
};

// Default export for backward compatibility
export default DarkTheme;
