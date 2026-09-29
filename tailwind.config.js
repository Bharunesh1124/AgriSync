/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: '#f0ece4',
        'cream-mid': '#e8e3d9',
        ink: '#0f0f0f',
        'ink-muted': '#555555',
        accent: '#ff6b00',
        'farm-green': '#10b981',
      },
      fontFamily: {
        display: ['BebasNeue_400Regular'],
        body: ['Inter_400Regular'],
        medium: ['Inter_500Medium'],
        bold: ['Inter_700Bold'],
      }
    },
  },
  plugins: [],
}
