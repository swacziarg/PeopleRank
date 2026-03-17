import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#09090b",
        panel: "#121217",
        line: "#2a2a34",
        accent: "#f4b860",
        accentSoft: "#3a2d18"
      },
      boxShadow: {
        glow: "0 20px 60px rgba(244, 184, 96, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
