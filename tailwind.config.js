/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'weydu-blue': '#009EDD',
        'weydu-light-blue': '#33B3E8',
        'weydu-dark-blue': '#0078A8',
      },
    },
  },
  plugins: [],
}


