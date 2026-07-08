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
        }
      },
      animation: {
        scroll: 'scroll 25s linear infinite',
        flash: 'flash 0.6s ease-out',
        tourbar: 'tourbar 8s linear'
      }
    },
  },
  plugins: [],
} satisfies Config;
