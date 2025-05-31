/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./index.css", // <--- ENSURE THIS LINE IS PRESENT
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}