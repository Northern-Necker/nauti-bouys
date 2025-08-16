/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Chesapeake Bay Blues - Primary palette
        bay: {
          50: '#f0f8fa',
          100: '#daeef4',
          200: '#b9dde9',
          300: '#87c5d8',
          400: '#4ea5c0',
          500: '#4A90A4',
          600: '#3d7489',
          700: '#355f70',
          800: '#2f4f5d',
          900: '#2b434f',
          950: '#1a2b34',
        },
        // Sandy Beach - Warm neutrals
        sand: {
          50: '#fdfcf8',
          100: '#faf6ed',
          200: '#f5e6d3',
          300: '#edd1b0',
          400: '#e3b885',
          500: '#d4a574',
          600: '#c18c5a',
          700: '#a1714a',
          800: '#835c40',
          900: '#6b4d37',
          950: '#39281c',
        },
        // Driftwood Gray - Weathered wood tones
        driftwood: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5dae2',
          300: '#b1bcc9',
          400: '#8b9dc3',
          500: '#6b7fa0',
          600: '#566485',
          700: '#47516c',
          800: '#3d445a',
          900: '#363a4c',
          950: '#242731',
        },
        // Marsh Green - Bay vegetation
        marsh: {
          50: '#f4f6f4',
          100: '#e6eae6',
          200: '#cfd5cf',
          300: '#adb8ad',
          400: '#7a9b76',
          500: '#5f7d5b',
          600: '#4a6347',
          700: '#3d503b',
          800: '#334132',
          900: '#2c372b',
          950: '#161d16',
        },
        // Oyster Shell - Clean whites
        oyster: {
          50: '#fefefe',
          100: '#fdfdfc',
          200: '#f8f6f0',
          300: '#f2ede4',
          400: '#e8dfd2',
          500: '#dccfbc',
          600: '#c9b59e',
          700: '#b09680',
          800: '#8f7a68',
          900: '#746356',
          950: '#3d342c',
        },
        // Sunset Accent - Golden hour
        sunset: {
          50: '#fef9f2',
          100: '#fef1e0',
          200: '#fce0c0',
          300: '#f9c896',
          400: '#f5a85f',
          500: '#d4a574',
          600: '#c8824a',
          700: '#a8663d',
          800: '#875237',
          900: '#6e4530',
          950: '#3b2318',
        },
        // Legacy colors for backward compatibility
        primary: {
          50: '#f0f8fa',
          100: '#daeef4',
          200: '#b9dde9',
          300: '#87c5d8',
          400: '#4ea5c0',
          500: '#4A90A4',
          600: '#3d7489',
          700: '#355f70',
          800: '#2f4f5d',
          900: '#2b434f',
          950: '#1a2b34',
        },
        teal: {
          50: '#f0f8fa',
          100: '#daeef4',
          200: '#b9dde9',
          300: '#87c5d8',
          400: '#4ea5c0',
          500: '#4A90A4',
          600: '#3d7489',
          700: '#355f70',
          800: '#2f4f5d',
          900: '#2b434f',
          950: '#1a2b34',
        },
        accent: {
          50: '#fef9f2',
          100: '#fef1e0',
          200: '#fce0c0',
          300: '#f9c896',
          400: '#f5a85f',
          500: '#d4a574',
          600: '#c8824a',
          700: '#a8663d',
          800: '#875237',
          900: '#6e4530',
          950: '#3b2318',
        }
      },
      fontFamily: {
        'display': ['Inter', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'float': 'float 4s ease-in-out infinite',
        'bay-wave': 'bayWave 3s ease-in-out infinite',
        'gentle-sway': 'gentleSway 5s ease-in-out infinite',
        'bay-pulse': 'bayPulse 2.5s ease-in-out infinite',
        'dock-float': 'dockFloat 6s ease-in-out infinite',
        'sunset-shift': 'sunsetShift 10s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        bayWave: {
          '0%, 100%': { transform: 'translateX(0px) translateY(0px)' },
          '33%': { transform: 'translateX(1px) translateY(-1px)' },
          '66%': { transform: 'translateX(-1px) translateY(1px)' },
        },
        gentleSway: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(1deg)' },
          '75%': { transform: 'rotate(-1deg)' },
        },
        bayPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.03)', opacity: '1' },
        },
        dockFloat: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-4px) rotate(0.5deg)' },
          '66%': { transform: 'translateY(4px) rotate(-0.5deg)' },
        },
        sunsetShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        }
      },
      backgroundImage: {
        'bay-gradient': 'linear-gradient(135deg, #4A90A4 0%, #87c5d8 50%, #f5e6d3 100%)',
        'sunset-gradient': 'linear-gradient(135deg, #d4a574 0%, #f5a85f 50%, #4A90A4 100%)',
        'dock-texture': 'linear-gradient(90deg, #8b9dc3 0%, #b1bcc9 50%, #8b9dc3 100%)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
