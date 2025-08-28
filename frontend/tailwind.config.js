/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0B1020',
          subtle: '#0F1629',
          raised: '#111A2E'
        },
        text: { soft: '#A7B3CF', dim: '#7E8AA6' },
        brand: {
          50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',400:'#818cf8',
          500:'#6366f1',600:'#5457e8',700:'#4346d2',800:'#373ab2',900:'#2d318f'
        },
        accent: { cyan:'#22d3ee', emerald:'#34d399', rose:'#fb7185', amber:'#f59e0b' },
      },
      borderRadius: { xl: '18px', lg: '12px', pill: '999px', 2: '2px' },
      boxShadow: {
        card: '0 6px 24px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.02)',
        focus: '0 0 0 3px rgba(99,102,241,.35)'
      }
    },
  },
  plugins: [],
}
