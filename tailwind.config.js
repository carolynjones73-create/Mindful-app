/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'serif': ['Crimson Text', 'Georgia', 'serif'],
        'display': ['Snell Roundhand', 'cursive'],
      },
      colors: {
        // Neutrals (Base + Backgrounds)
        'warm-beige': '#D9CFC4',
        'soft-ivory': '#F5F2ED',
        'stone-grey': '#B8B6B1',
        
        // Accents (Depth + Emphasis)
        'muted-taupe': '#A89C90',
        'greige': '#C7BFB4',
        'soft-clay': '#C9A99A',
        
        // Highlights (Light + Energetic Notes)
        'opal': '#E6DFF4',
        'warm-blush': '#E6CFC7',
        'golden-cream': '#F3E3C6',
        
        // Nature-Inspired Touches
        'sage-green': '#A3A69C',
        'palm-green': '#7F8C78',
        'soft-sky': '#D6DBE2',
        'pale-moon': '#E8E2D6',
      },
    },
  },
  plugins: [],
};