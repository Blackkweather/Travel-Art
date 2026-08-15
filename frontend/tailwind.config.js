module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B1F3F',
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#0B1F3F',
        },
        // Sampled from the compass rose in the brand wordmark (#B99851).
        // This token was previously teal, which clashed with the gold logo it
        // sat beside. Gold is the single accent for the whole site.
        gold: {
          DEFAULT: '#B99851',
          50: '#FBF8F1',
          100: '#F4ECD9',
          200: '#E8D8B4',
          300: '#DAC189',
          400: '#CAAC6C',
          500: '#B99851',
          600: '#9B7C3E',
          700: '#7B6231',
          800: '#5A4827',
          900: '#3B301B',
        },
        cream: {
          DEFAULT: '#F9F8F3',
          50: '#F9F8F3',
          100: '#f5f4f0',
          200: '#ebe9e1',
          300: '#e1ded2',
          400: '#d7d3c3',
          500: '#cdc8b4',
          600: '#a39d8f',
          700: '#79726a',
          800: '#4f4745',
          900: '#251c20',
        },
        'off-black': '#111111',

        // Semantic surfaces and text, resolved from the CSS custom properties
        // in index.css. Using these instead of bg-white / text-gray-900 is what
        // lets a screen follow the theme: the .dark class swaps the underlying
        // variables and every surface moves with it. Pages that hardcode grey
        // scales are frozen in the light theme no matter what the toggle says.
        surface: {
          DEFAULT: 'var(--surface)',
          raised: 'var(--surface-raised)',
          sunken: 'var(--surface-sunken)',
          inverse: 'var(--surface-inverse)',
        },
        content: {
          DEFAULT: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          inverse: 'var(--text-on-inverse)',
        },
        line: {
          DEFAULT: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
      },
      // Cormorant Garamond echoes the engraved serif of the wordmark and earns
      // its place on a heritage/luxury brief. Outfit replaces Inter for UI text.
      // Both are self-hosted through fontsource - no render-blocking Google
      // Fonts request.
      fontFamily: {
        'serif': ['"Cormorant Garamond Variable"', 'Cormorant Garamond', 'Georgia', 'serif'],
        'sans': ['"Outfit Variable"', 'Outfit', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        // The shape system, and the only radii allowed on this site.
        //
        // Both are near-sharp. A 2px corner is the single strongest signal that
        // a page belongs to a heritage brand rather than a SaaS dashboard: the
        // luxury houses this product sits beside (Aman, Hermes, Dior) all set
        // type and images to hard edges. `control` was 999px, which put pill
        // buttons against square photography and read as consumer-app chrome.
        //
        // Circles and capsules keep Tailwind's own `rounded-full`, which stays
        // correct for the things that are actually round: avatars, status dots,
        // spinners, progress tracks and status chips. Those are objects, not
        // controls, so they are outside this scale by design.
        'card': '2px',
        'control': '2px',
      },
      maxWidth: {
        'shell': '1400px',
        'prose': '65ch',
      },
      transitionTimingFunction: {
        'entrance': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
        '160': '40rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-in-up': 'slideInUp 0.6s ease-out',
        'slide-in-left': 'slideInLeft 0.8s ease-out',
        'slide-in-right': 'slideInRight 0.8s ease-out',
        'scale-in': 'scaleIn 0.6s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'float-enhanced': 'floatEnhanced 6s ease-in-out infinite',
        'parallax-float': 'parallaxFloat 8s ease-in-out infinite',
        'gold-glow': 'goldGlow 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'bounce-gentle': 'bounceGentle 3s ease-in-out infinite',
        'carousel-slide': 'carouselSlide 30s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        floatEnhanced: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-20px) rotate(1deg)' },
          '66%': { transform: 'translateY(-10px) rotate(-1deg)' },
        },
        parallaxFloat: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '25%': { transform: 'translateY(-15px) translateX(5px)' },
          '50%': { transform: 'translateY(-25px) translateX(-5px)' },
          '75%': { transform: 'translateY(-10px) translateX(3px)' },
        },
        // rgba(20, 184, 166) is teal - left over from the palette that shipped
        // before gold became the single accent. An animation named goldGlow
        // was pulsing teal against a navy-and-gold page.
        goldGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(185, 152, 81, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(185, 152, 81, 0.6), 0 0 30px rgba(185, 152, 81, 0.4)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(185, 152, 81, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(185, 152, 81, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        carouselSlide: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      },
      // Resolved from the CSS custom properties in index.css so a shadow
      // re-tints when the theme flips. These were four hardcoded pure-black
      // values, and because Tailwind's utilities layer outranks the @layer
      // components block where index.css defines the same four class names,
      // these were the shadows that actually rendered - the navy-tinted,
      // theme-aware ones in index.css never applied to anything. Pure black
      // shadows on a navy surface are what made cards look muddy.
      boxShadow: {
        'soft': 'var(--shadow-soft)',
        'medium': 'var(--shadow-medium)',
        'large': 'var(--shadow-large)',
        'luxury': 'var(--shadow-luxury)',
      }
    },
  },
  plugins: [],
}


