export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#003870',      // Jioplix Deep Medical Blue
          accent: '#0056A8',    // Jioplix Medical Blue
          sky: '#0078FF',       // Jioplix Sky Blue
          teal: '#00C897',      // Jioplix Healthcare Teal
          slate: '#546E7A',     // Jioplix Neutral Slate
        }
      },
      fontFamily: {
        heading: ['Poppins', 'system-ui', 'sans-serif'],
        ui: ['Open Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
