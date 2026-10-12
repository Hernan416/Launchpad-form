import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#0067EB",
          "blue-dark": "#0052BD",
          yellow: "#FFCF00",
          bg: "#080808",
          surface: "#111111",
          "surface-hover": "#181818",
          ink: "#FFFFFF",
          muted: "rgba(255,255,255,0.62)",
          line: "rgba(255,255,255,0.08)",
        },
      },
      fontFamily: {
        display: ["var(--font-inter)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        brand: "10px",
        "brand-lg": "14px",
        pill: "999px",
      },
      boxShadow: {
        soft: "0 4px 20px rgba(0, 0, 0, 0.4)",
      },
      keyframes: {
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.5s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
