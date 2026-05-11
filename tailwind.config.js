/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: '#00f3ff',
          magenta: '#ff00ff',
          yellow: '#fbff00',
        }
      },
      animation: {
        'glitch-pulse': 'glitch 0.3s ease-in-out infinite',
      },
      keyframes: {
        glitch: {
          '0%, 100%': { transform: 'skew(0deg)', opacity: '1' },
          '20%': { transform: 'skew(-5deg)', opacity: '0.8' },
          '40%': { transform: 'skew(5deg)', opacity: '0.9' },
          '60%': { transform: 'skew(-2deg)', opacity: '1' },
          '80%': { transform: 'skew(2deg)', opacity: '0.8' },
        }
      }
    },
  },
  plugins: [],
}
