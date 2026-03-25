/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
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
        },
        gold: {
          100: '#faeeda',
          200: '#fac775',
          300: '#ef9f27',
          400: '#ba7517',
          500: '#854f0b',
          600: '#633806',
        },
        sage: {
          100: '#eaf3de',
          200: '#c0dd97',
          300: '#97c459',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
