/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hydroGreen: '#1b5e20',
        hydroLightGreen: '#e8f5e9',
        hydroCyan: '#00838f',
        hydroLightCyan: '#e0f7fa',
      }
    },
  },
  plugins: [],
}

