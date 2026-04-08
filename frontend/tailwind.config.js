/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-blue': '#00f5ff',
        'neon-pink': '#ff00ff',
        'neon-green': '#39ff14',
      }
    },
  },
  plugins: [],
}
