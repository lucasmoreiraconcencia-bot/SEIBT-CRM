import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta vintage Copa 2002 (Coreia/Japão): navy profundo, dourado, vermelho e azul
        copa: {
          navy: "#0A1228",
          navyLight: "#142048",
          ink: "#070D1E",
          gold: "#F5C44C",
          goldLight: "#FFD75E",
          goldDark: "#D9A520",
          red: "#E0303B",
          blue: "#2E6BFF",
          cyan: "#37C8F0",
          cream: "#F5F2E8",
          green: "#0B7A4B",
          greenDark: "#075235",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Arial Narrow", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 32px -8px rgba(245, 196, 76, 0.45)",
        card: "0 8px 32px -12px rgba(0, 0, 0, 0.55)",
      },
    },
  },
  plugins: [],
};

export default config;
