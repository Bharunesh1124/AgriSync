export const MaxContentWidth = 1200;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Colors = {
  light: {
    text: '#111827',
    textSecondary: '#6b7280',
    background: '#ffffff',
    backgroundElement: '#f3f4f6',
    backgroundSelected: '#e5e7eb',
    border: '#e5e7eb',
    tint: '#2563eb',
  },
  dark: {
    text: '#f9fafb',
    textSecondary: '#9ca3af',
    background: '#111827',
    backgroundElement: '#1f2937',
    backgroundSelected: '#374151',
    border: '#374151',
    tint: '#3b82f6',
  },
};

export type ThemeColor =
  | 'text'
  | 'textSecondary'
  | 'background'
  | 'backgroundElement'
  | 'backgroundSelected'
  | 'border'
  | 'tint';

export const Fonts = {
  mono: 'Courier',
};
