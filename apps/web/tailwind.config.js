/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0E0F12',
        surface: '#1A1C22',
        'surface-elev': '#252830',
        'surface-crisis': '#2A1A14',
        'border-subtle': '#2E323B',
        'border-strong': '#3F4452',
        'border-crisis': '#E84B2A',
        'text-primary': '#F5F4ED',
        'text-secondary': '#B8B6A9',
        'text-muted': '#7D7B6F',
        'accent-cash': '#28C76F',
        'accent-passive': '#34D399',
        'accent-debt': '#E84B2A',
        'accent-warning': '#F5A524',
        'accent-host': '#A78BFA',
        'accent-epoch': '#5BD7E0',
        'accent-deal': '#7B5BD7',
        'accent-pass': '#5BA0D7',
        'accent-help': '#F5C524',
        'accent-chaos': '#D7445B',
        'accent-gold': '#F5C524',
        'accent-partner': '#9F7AEA',
        'accent-pet': '#F5A524',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
