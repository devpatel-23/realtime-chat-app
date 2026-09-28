/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chat: {
          bg: '#0f172a',
          card: '#1e293b',
          input: '#334155',
          primary: '#6366f1',
          primaryHover: '#4f46e5',
          bubbleSelf: '#4f46e5',
          bubbleOther: '#334155',
          textMuted: '#94a3b8'
        }
      }
    },
  },
  plugins: [],
}
