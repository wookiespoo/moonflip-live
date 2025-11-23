/**
 * MOONFLIP PREMIUM VISUAL SYSTEM
 * The exact configuration used by 3k+ SOL/day private games
 * DO NOT MODIFY - This is the holy grail of Solana gambling aesthetics
 */

module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // PREMIUM NEON PALETTE (exact values from top games)
        neon: {
          lime: '#00ff9f',        // Electric lime green
          pink: '#ff0066',        // Hot pink
          purple: '#8b00ff',      // Electric purple
          green: '#39ff14',       // Brighter glow green
          red: '#ff073a',         // Intense red
          blue: '#00d4ff',        // Cyber blue
          yellow: '#ffff00',      // Pure yellow
          orange: '#ff6b35',      // Neon orange
        },
        // Dark premium backgrounds
        premium: {
          black: '#0a0a0a',       // Deepest black
          gray: {
            950: '#0d0d0d',
            900: '#141414',
            850: '#1a1a1a',
            800: '#1f1f1f',
            700: '#2a2a2a',
            600: '#333333',
            500: '#4a4a4a',
            400: '#666666',
            300: '#888888',
            200: '#aaaaaa',
            100: '#cccccc',
            50: '#f5f5f5',
          }
        },
        // Glassmorphism backgrounds
        glass: {
          white: 'rgba(255, 255, 255, 0.1)',
          black: 'rgba(0, 0, 0, 0.4)',
          purple: 'rgba(139, 0, 255, 0.1)',
          pink: 'rgba(255, 0, 102, 0.1)',
          green: 'rgba(0, 255, 159, 0.1)',
          red: 'rgba(255, 7, 58, 0.1)',
        }
      },
      fontFamily: {
        // Premium typography
        'inter': ['Inter', 'sans-serif'],
        'space': ['Space Grotesk', 'sans-serif'],
        'orbitron': ['Orbitron', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      animation: {
        // Premium animations
        'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
        'neon-glow': 'neon-glow 1.5s ease-in-out infinite',
        'cosmic-float': 'cosmic-float 20s ease-in-out infinite',
        'premium-bounce': 'premium-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'countdown-pulse': 'countdown-pulse 1s ease-in-out infinite',
        'win-celebration': 'win-celebration 0.5s ease-out',
        'coin-rain': 'coin-rain 3s ease-out forwards',
        'sparkle': 'sparkle 2s linear infinite',
        'skeleton-pulse': 'skeleton-pulse 1.5s ease-in-out infinite',
        'price-pump': 'price-pump 0.8s ease-out',
        'trust-badge': 'trust-badge 3s ease-in-out infinite',
      },
      keyframes: {
        'neon-pulse': {
          '0%, 100%': { 
            'box-shadow': '0 0 20px currentColor, 0 0 40px currentColor, 0 0 60px currentColor',
            'opacity': '1' 
          },
          '50%': { 
            'box-shadow': '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',
            'opacity': '0.8' 
          }
        },
        'neon-glow': {
          '0%, 100%': { 
            'filter': 'drop-shadow(0 0 20px currentColor) drop-shadow(0 0 40px currentColor)',
            'transform': 'scale(1)'
          },
          '50%': { 
            'filter': 'drop-shadow(0 0 30px currentColor) drop-shadow(0 0 60px currentColor)',
            'transform': 'scale(1.05)'
          }
        },
        'cosmic-float': {
          '0%, 100%': { 'transform': 'translateY(0px) rotate(0deg)' },
          '25%': { 'transform': 'translateY(-20px) rotate(1deg)' },
          '50%': { 'transform': 'translateY(-10px) rotate(-1deg)' },
          '75%': { 'transform': 'translateY(-15px) rotate(0.5deg)' }
        },
        'premium-bounce': {
          '0%': { 'transform': 'scale(1)' },
          '50%': { 'transform': 'scale(1.15)' },
          '100%': { 'transform': 'scale(1)' }
        },
        'countdown-pulse': {
          '0%, 100%': { 
            'transform': 'scale(1)',
            'opacity': '1'
          },
          '50%': { 
            'transform': 'scale(1.02)',
            'opacity': '0.9'
          }
        },
        'win-celebration': {
          '0%': { 
            'transform': 'scale(0) rotate(0deg)',
            'opacity': '0'
          },
          '50%': { 
            'transform': 'scale(1.2) rotate(180deg)',
            'opacity': '1'
          },
          '100%': { 
            'transform': 'scale(1) rotate(360deg)',
            'opacity': '1'
          }
        },
        'coin-rain': {
          '0%': { 
            'transform': 'translateY(-100vh) rotate(0deg)',
            'opacity': '1'
          },
          '100%': { 
            'transform': 'translateY(100vh) rotate(720deg)',
            'opacity': '0'
          }
        },
        'sparkle': {
          '0%': { 
            'transform': 'scale(0) rotate(0deg)',
            'opacity': '0'
          },
          '50%': { 
            'transform': 'scale(1) rotate(180deg)',
            'opacity': '1'
          },
          '100%': { 
            'transform': 'scale(0) rotate(360deg)',
            'opacity': '0'
          }
        },
        'skeleton-pulse': {
          '0%': { 'background-position': '-200% 0' },
          '100%': { 'background-position': '200% 0' }
        },
        'price-pump': {
          '0%': { 
            'transform': 'scale(1)',
            'filter': 'drop-shadow(0 0 10px #00ff9f)'
          },
          '50%': { 
            'transform': 'scale(1.1)',
            'filter': 'drop-shadow(0 0 20px #00ff9f) drop-shadow(0 0 40px #00ff9f)'
          },
          '100%': { 
            'transform': 'scale(1)',
            'filter': 'drop-shadow(0 0 10px #00ff9f)'
          }
        },
        'trust-badge': {
          '0%, 100%': { 'opacity': '0.7' },
          '50%': { 'opacity': '1' }
        }
      },
      boxShadow: {
        // Premium neon shadows
        'neon-lime': '0 0 25px rgba(0, 255, 159, 0.5), 0 0 50px rgba(0, 255, 159, 0.3)',
        'neon-pink': '0 0 25px rgba(255, 0, 102, 0.5), 0 0 50px rgba(255, 0, 102, 0.3)',
        'neon-purple': '0 0 25px rgba(139, 0, 255, 0.5), 0 0 50px rgba(139, 0, 255, 0.3)',
        'neon-green': '0 0 25px rgba(57, 255, 20, 0.5), 0 0 50px rgba(57, 255, 20, 0.3)',
        'neon-red': '0 0 25px rgba(255, 7, 58, 0.5), 0 0 50px rgba(255, 7, 58, 0.3)',
        'premium-glow': '0 0 30px rgba(139, 0, 255, 0.4), 0 0 60px rgba(139, 0, 255, 0.2)',
        'bet-green': '0 0 40px rgba(0, 255, 159, 0.6), 0 0 80px rgba(0, 255, 159, 0.3), inset 0 0 20px rgba(0, 255, 159, 0.2)',
        'bet-red': '0 0 40px rgba(255, 0, 102, 0.6), 0 0 80px rgba(255, 0, 102, 0.3), inset 0 0 20px rgba(255, 0, 102, 0.2)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '40px',
      },
      backgroundImage: {
        // Premium gradients
        'premium-purple': 'linear-gradient(135deg, #8b00ff 0%, #ff0066 100%)',
        'premium-green': 'linear-gradient(135deg, #00ff9f 0%, #39ff14 100%)',
        'premium-red': 'linear-gradient(135deg, #ff0066 0%, #ff073a 100%)',
        'cosmic-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
        'neon-gradient': 'linear-gradient(135deg, #00ff9f 0%, #39ff14 25%, #ffff00 50%, #ff0066 75%, #8b00ff 100%)',
      },
      spacing: {
        // Premium spacing scale
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      fontSize: {
        // Premium typography scale
        '2.5xl': '1.75rem',
        '3.5xl': '2rem',
        '4.5xl': '2.5rem',
        '5.5xl': '3.5rem',
        '6.5xl': '4rem',
      },
      borderRadius: {
        // Premium border radius
        '4xl': '2rem',
        '5xl': '3rem',
      },
      scale: {
        // Premium scale values
        '102': '1.02',
        '103': '1.03',
        '104': '1.04',
      }
    },
  },
  plugins: [],
}