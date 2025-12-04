/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0C0F12',
          layer: '#12161C',
          elevated: '#151A21',
          subtle: '#0F1318',
        },
        text: {
          primary: '#E6F1FF',
          secondary: '#A3B3C5',
          muted: '#7A8898',
          inverse: '#0C0F12',
        },
        accent: {
          primary: '#00E5FF',
          secondary: '#7C4DFF',
        },
        success: '#22D3A0',
        warning: '#FFB020',
        danger: '#FF5A6E',
        info: '#5AC8FA',
        line: {
          base: '#1E2630',
          circuit: 'rgba(0,229,255,0.12)',
        },
      },
    },
  },
  plugins: [],
};
