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
        sm:    '0.25rem',   //  4px (was 2px)
        DEFAULT:'0.375rem', //  6px (was 4px)
        md:    '0.5rem',    //  8px (was 6px)
        lg:    '0.75rem',   // 12px (was 8px)
        xl:    '1rem',      // 16px (was 12px)
        '2xl': '1.25rem',   // 20px (was 16px)
        '3xl': '1.75rem',   // 28px (was 24px)
        '4xl': '2rem',      // 32px (new)
      },
      colors: {
        forest: {
          50:  '#f0f7ee',
          100: '#d8eccc',
          200: '#b4d99a',
          300: '#8ac165',
          400: '#639922',
          500: '#3b6d11',
          600: '#27500a',
          700: '#173404',
          800: '#0e2202',
          900: '#071101',
        },
        gold: {
          100: '#faeeda',
          200: '#fac775',
          300: '#ef9f27',
          400: '#ba7517',
          500: '#854f0b',
          600: '#633806',
          700: '#412402',
        },
        sage: {
          100: '#eaf3de',
          200: '#c0dd97',
          300: '#97c459',
          400: '#6ea832',
          500: '#4d8520',
          600: '#346314',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
