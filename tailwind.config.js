/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        sm: '0.25rem', DEFAULT: '0.5rem', md: '0.625rem', lg: '0.75rem',
        xl: '1rem', '2xl': '1.25rem', '3xl': '1.5rem', '4xl': '2rem',
      },
      colors: {
        background: 'var(--background)', foreground: 'var(--foreground)',
        muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        accent: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-foreground)' },
        border: 'var(--border)', ring: 'var(--ring)',
        primary: { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
        secondary: { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-foreground)' },
        destructive: { DEFAULT: 'var(--destructive)', foreground: 'var(--destructive-foreground)' },
        popover: { DEFAULT: 'var(--popover)', foreground: 'var(--popover-foreground)' },
        input: 'var(--input)',
        blue: { 50:'#EFF6FF',100:'#DBEAFE',200:'#BFDBFE',300:'#93C5FD',400:'#60A5FA',500:'#3B82F6',600:'#2563EB',700:'#1D4ED8',800:'#1E40AF',900:'#1E3A8A' },
        ink: { 50:'#F4F6FA',100:'#E6EAF2',200:'#C9D1E0',300:'#9AA7BF',400:'#6B7A96',500:'#475570',600:'#2F3D5A',700:'#1E2C49',800:'#13203A',900:'#0B1730' },
        sun: { 50:'#FFFBEB',100:'#FEF3C7',200:'#FDE68A',300:'#FCD34D',400:'#FBBF24',500:'#F59E0B',600:'#D97706' },
        paper: '#F6F7FB',
        pink: { 50:'#FDF2F8',100:'#FCE7F3',200:'#FBCFE8',300:'#F9A8D4',400:'#F472B6',500:'#EC4899',600:'#DB2777',700:'#BE185D',800:'#9D174D',900:'#831843' },
      },
      borderColor: { DEFAULT: 'var(--border)' },
      fontFamily: { sans: ['var(--font-sans)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'], display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgba(11,23,48,0.04), 0 4px 16px rgba(11,23,48,0.05)', lift: '0 2px 4px rgba(11,23,48,0.05), 0 12px 32px rgba(11,23,48,0.10)' },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease-out both',
        'fade-in': 'fadeIn 0.3s ease-out both',
        'slide-in-right': 'slideInRight 0.3s ease-out both',
        'float-up': 'floatUp 1s ease-out both',
        'pulse-pink': 'pulse-pink 2s ease-in-out infinite',
        'level-up': 'levelUp 0.5s ease-out both',
        'progress-fill': 'progressFill 0.6s ease-out both',
      },
    },
  },
  plugins: [],
}
