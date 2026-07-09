import type { Config } from "tailwindcss";
export default {
  content: ["./pages/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      keyframes: {
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        flash: {
          '0%': { backgroundColor: 'rgba(16, 185, 129, 0.12)' },
          '100%': { backgroundColor: 'transparent' }
        },
        tourbar: {
          '0%': { width: '0%' },
          '100%': { width: '100%' }
        },
        stepin: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        pulseBorder: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' }
        },
        fadein: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      },
      animation: {
        scroll: 'scroll 25s linear infinite',
        flash: 'flash 0.6s ease-out',
        tourbar: 'tourbar 8s linear',
        tourbar5: 'tourbar 5s linear',
        stepin: 'stepin 0.4s ease-out',
        'pulse-border': 'pulseBorder 1.5s ease-in-out infinite',
        fadein: 'fadein 0.25s ease-out'
      }
    },
  },
  plugins: [],
} satisfies Config;
