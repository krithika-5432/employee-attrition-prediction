module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 900: '#0a0f1e', 800: '#0d1526', 700: '#111d35', 600: '#162040' },
        slate: { 700: '#1e2a3a', 600: '#243044', 500: '#2d3b52' },
        accent: { DEFAULT: '#3b82f6', hover: '#2563eb', glow: '#60a5fa' },
        emerald: { glow: '#10b981' },
        amber: { glow: '#f59e0b' },
        red: { glow: '#ef4444' },
      },
      backdropBlur: { xs: '2px' },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'count-up': 'countUp 1s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      }
    }
  },
  plugins: [],
}
