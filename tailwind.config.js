/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        navy: {
          800: '#1E293B',
          900: '#0F172A',
        },
        slate: {
          muted: '#64748B',
          surface: '#F8FAFC',
          border: '#E2E8F0',
        },
        status: {
          submitted: '#64748B',
          submittedBg: '#F1F5F9',
          viewed: '#2563EB',
          viewedBg: '#EFF6FF',
          progress: '#D97706',
          progressOrange: '#EA580C',
          progressBg: '#FEF3C7',
          resolved: '#16A34A',
          resolvedBg: '#DCFCE7',
        }
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 10px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02)',
        'card-hover': '0 8px 24px rgba(37, 99, 235, 0.08), 0 2px 6px rgba(15, 23, 42, 0.04)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      }
    },
  },
  plugins: [],
}
