module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
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
        gold: {
          DEFAULT: '#C9A63C',
          50: '#fdf9e7',
          100: '#fbf2cf',
          200: '#f7e59f',
          300: '#f3d86f',
          400: '#efcb3f',
          500: '#C9A63C',
          600: '#a68a32',
          700: '#7d6b28',
          800: '#544c1e',
          900: '#2b2d14',
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
        'off-black': '#111111'
      },
      fontFamily: {
        'serif': ['Playfair Display', 'serif'],
        'sans': ['Inter', 'sans-serif'],
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
        goldGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(201, 166, 60, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(201, 166, 60, 0.6), 0 0 30px rgba(201, 166, 60, 0.4)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(201, 166, 60, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(201, 166, 60, 0.6)' },
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
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'medium': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'large': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'luxury': '0 25px 50px -12px rgba(11, 31, 63, 0.25)',
      }
    },
  },
  plugins: [],
}


