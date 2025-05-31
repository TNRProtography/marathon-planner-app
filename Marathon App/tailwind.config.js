/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",                   // Scans Marathon App/index.html
    "./App.tsx",                      // Scans Marathon App/App.tsx
    "./index.tsx",                    // Scans Marathon App/index.tsx
    "./components/**/*.{js,ts,jsx,tsx}", // Scans all .js, .ts, .jsx, .tsx files
                                      // in Marathon App/components/ and any subfolders
                                      // (like Marathon App/components/icons/)
    // You do NOT appear to have an 'src' folder containing .tsx files with UI,
    // so you don't need a line for "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}