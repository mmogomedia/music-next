// Centralized Design System Configuration
// Following rules/00-ui-design-system.md specifications

export const designSystem = {
  // Brand Colors - Following exact specifications from rules
  brand: {
    primary: '#22c55e', // Green - Main brand color
    secondary: '#eab308', // Yellow - Secondary actions
    accent: '#0ea5e9', // Blue - Additional variety
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
  },

  // Typography - Following exact specifications from rules
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
    },
    fontSize: {
      '6xl': '3.75rem', // 60px - Hero titles
      '5xl': '3rem', // 48px - Page titles
      '4xl': '2.25rem', // 36px - Section titles
      '3xl': '1.875rem', // 30px - Subsection titles
      '2xl': '1.5rem', // 24px - Card titles
      xl: '1.25rem', // 20px - Large text
      lg: '1.125rem', // 18px - Body large
      base: '1rem', // 16px - Body text
      sm: '0.875rem', // 14px - Small text
      xs: '0.75rem', // 12px - Caption text
    },
    fontWeight: {
      thin: '100',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
  },

  // Spacing - Following exact specifications from rules
  spacing: {
    0: '0',
    1: '0.25rem', // 4px
    2: '0.5rem', // 8px
    3: '0.75rem', // 12px
    4: '1rem', // 16px
    5: '1.25rem', // 20px
    6: '1.5rem', // 24px
    8: '2rem', // 32px
    10: '2.5rem', // 40px
    12: '3rem', // 48px
    16: '4rem', // 64px
    20: '5rem', // 80px
    24: '6rem', // 96px
    32: '8rem', // 128px
  },

  // Border Radius - Following exact specifications from rules
  borderRadius: {
    none: '0',
    sm: '0.125rem', // 2px
    base: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px', // Fully rounded
  },

  // Shadows - Following exact specifications from rules
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glow: '0 0 20px rgba(34, 197, 94, 0.3)',
    glowSecondary: '0 0 20px rgba(234, 179, 8, 0.3)',
  },

  // Animations - Following exact specifications from rules
  animations: {
    duration: {
      fast: '150ms', // Micro-interactions
      normal: '300ms', // Standard transitions
      slow: '500ms', // Page transitions
      slower: '800ms', // Complex animations
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeBounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  // Component Configurations
  components: {
    button: {
      sizes: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
        xl: 'h-14 px-8 text-xl',
      },
      variants: {
        primary: 'bg-primary text-white hover:bg-primary/90 shadow-glow',
        secondary:
          'bg-secondary text-black hover:bg-secondary/90 shadow-glowSecondary',
        outline:
          'border-2 border-primary text-primary hover:bg-primary hover:text-white',
        ghost: 'text-primary hover:bg-primary/10',
        glass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white',
      },
    },
    card: {
      base: 'bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800',
      glass: 'bg-white/10 backdrop-blur-md border border-white/20 rounded-xl',
      hover: 'hover:shadow-xl hover:scale-105 transition-all duration-300',
    },
    input: {
      base: 'w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200',
    },
  },

  // Layout
  layout: {
    container: {
      base: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
      narrow: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8',
      wide: 'max-w-full px-4 sm:px-6 lg:px-8',
    },
    section: {
      base: 'py-16 sm:py-20 lg:py-24',
      small: 'py-8 sm:py-12',
      large: 'py-20 sm:py-28 lg:py-32',
    },
  },

  // Gradients
  gradients: {
    primary: 'bg-gradient-to-r from-primary to-secondary',
    primaryVertical: 'bg-gradient-to-b from-primary to-secondary',
    hero: 'bg-gradient-to-br from-primary/20 via-transparent to-secondary/20',
    card: 'bg-gradient-to-br from-white/10 to-white/5',
    text: 'bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent',
  },
} as const;

// Utility functions for using the design system
export const getSpacing = (size: keyof typeof designSystem.spacing) =>
  designSystem.spacing[size];
export const getColor = (color: string) =>
  designSystem.brand[color as keyof typeof designSystem.brand] || color;
export const getShadow = (size: keyof typeof designSystem.shadows) =>
  designSystem.shadows[size];
export const getGradient = (type: keyof typeof designSystem.gradients) =>
  designSystem.gradients[type];

// CSS Custom Properties for dynamic theming
export const cssVariables = {
  '--color-primary': designSystem.brand.primary,
  '--color-secondary': designSystem.brand.secondary,
  '--color-accent': designSystem.brand.accent,
  '--shadow-glow': designSystem.shadows.glow,
  '--shadow-glow-secondary': designSystem.shadows.glowSecondary,
} as const;
