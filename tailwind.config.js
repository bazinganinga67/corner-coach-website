/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#050506',
        surface: '#0b0b0e',
        panel: '#111318',
        accent: '#FF2E3E',
        accentDeep: '#B30F1F',
        accentSoft: 'rgba(255,46,62,0.14)',
        bone: '#F5F3EF',
        mute: '#8A8F9C',
        line: 'rgba(255,255,255,0.09)',
        caution: '#E8B506',
        cautionDeep: '#A67F00',
        garage: '#0D0D0F',
        concrete: '#1A1A1E',
        chalk: '#E8E6E1',
        rust: '#8B3A2F',
      },
      fontFamily: {
        display: ['"Inter Tight"', '"Inter"', 'sans-serif'],
        body: ['"General Sans"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        none: '0',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        full: '9999px',
      },
      animation: {
        'spin-slow': 'spin 4s linear infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
        'pulse-soft': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        30: '7.5rem',
        34: '8.5rem',
        38: '9.5rem',
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
    },
  },
  plugins: [],
};
