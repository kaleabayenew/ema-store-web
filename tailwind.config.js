/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#f7faf8',
          100: '#eef4ef',
          200: '#dde8e0',
          300: '#c4d3c8',
          400: '#96a69b',
          500: '#66766b',
          600: '#4b5a50',
          700: '#35433a',
          800: '#26342a',
          900: '#1a2520',
          950: '#111b15',
        },
        brand: {
          50: '#eff9f3',
          100: '#dcf2e5',
          200: '#bce6ce',
          300: '#8fd5ad',
          400: '#5cc286',
          500: '#2bae66',
          600: '#217a46',
          700: '#195f39',
          800: '#154b30',
          900: '#103d28',
          950: '#092b19',
        },
        yellow: {
          500: '#F5A623',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 23, 42, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Ethiopic', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

