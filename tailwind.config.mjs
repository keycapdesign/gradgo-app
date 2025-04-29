/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-primary': 'linear-gradient(128deg, rgba(105,12,215,1) 0%, rgba(146,70,251,1) 100%)',
      },
      width: {
        'sidebar': 'var(--sidebar-width)',
        'sidebar-icon': 'var(--sidebar-width-icon)',
        'sidebar-mobile': 'var(--sidebar-width-mobile)',
      },
    },
  },
  plugins: [],
}
