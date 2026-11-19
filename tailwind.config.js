/** @type {import('tailwindcss').Config} */

// "Workbook" palette (Nov 2026 redesign). Computed from OKLCH, stored as hex so
// it also works in old Android browsers and inside lesson SVGs.
//   board  - chalkboard green: the brand colour and the High School course
//   copper - Zambian copper: the IELTS course and the one warm accent
//   sun    - highlighter yellow: emphasis and "not yet" states
//   ink    - neutrals, tinted slightly green
//   rose   - marking-pen red: errors only
const board = { 50: '#F0F9F4', 100: '#DFF3E7', 200: '#C2E7D2', 300: '#96D0B0', 400: '#5FAF86', 500: '#338A62', 600: '#1A6B48', 700: '#0F5337', 800: '#0B3E28', 900: '#082D1C', 950: '#051E12' }
const copper = { 50: '#FFF4EE', 100: '#FFE7DA', 200: '#FDD0B6', 300: '#F5AF84', 400: '#E78F56', 500: '#D27534', 600: '#B05C1F', 700: '#8B4715', 800: '#693510', 900: '#4D270D', 950: '#33190A' }
const sun = { 50: '#FFFAE4', 100: '#FFF0C0', 200: '#FFE490', 300: '#FFD658', 400: '#FCC82C', 500: '#E5B30B', 600: '#9F7A00', 700: '#785C00', 800: '#5C4700', 900: '#453500' }
const ink = { 50: '#F4F7F5', 100: '#EAEEEB', 200: '#D8DEDA', 300: '#B8C0BB', 400: '#6E7973', 500: '#58635D', 600: '#45504A', 700: '#2F3A33', 800: '#1D2721', 900: '#0F1713', 950: '#080D0A' }
const rose = { 50: '#FFF2F1', 100: '#FFE4E0', 200: '#FFCCC6', 300: '#FBA89E', 400: '#F27166', 500: '#E64841', 600: '#CC2E2C', 700: '#A32321', 800: '#811E1B', 900: '#631B17' }

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
      // Tighter corners than Tailwind's defaults: print-like, not bubbly.
      borderRadius: {
        sm: '3px', DEFAULT: '5px', md: '6px', lg: '8px',
        xl: '10px', '2xl': '12px', '3xl': '16px', '4xl': '20px',
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
        board, copper, sun, ink, rose,
        white: '#FEFEFC',
        paper: '#F9F9F7',
        chalk: '#F8F7EE',
        // Older class names keep working and pick up the new palette:
        // blue/emerald/green = board, teal/orange = copper, amber/yellow = sun,
        // gray/slate = ink, red = rose. New code should use the real names.
        blue: board, emerald: board, green: board,
        teal: copper, orange: copper, pink: copper,
        amber: sun, yellow: sun,
        gray: ink, slate: ink,
        red: rose,
        violet: board, purple: board, indigo: board,
      },
      borderColor: { DEFAULT: 'var(--border)' },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 0 0 0 transparent',
        lift: '0 1px 0 rgba(15,23,19,0.04), 0 8px 24px -12px rgba(15,23,19,0.18)',
        sm: '0 1px 0 rgba(15,23,19,0.05)',
        DEFAULT: '0 1px 2px rgba(15,23,19,0.06)',
        md: '0 2px 8px -2px rgba(15,23,19,0.10)',
        lg: '0 8px 24px -12px rgba(15,23,19,0.18)',
        xl: '0 16px 40px -16px rgba(15,23,19,0.22)',
        '2xl': '0 24px 56px -20px rgba(15,23,19,0.26)',
        sheet: '0 1px 0 rgba(15,23,19,0.05), 0 18px 40px -22px rgba(8,45,28,0.35)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fadeIn 0.3s ease-out both',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        'float-up': 'floatUp 1s ease-out both',
        'pulse-pink': 'pulse-pink 2s ease-in-out infinite',
        'level-up': 'levelUp 0.5s ease-out both',
        'progress-fill': 'progressFill 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
