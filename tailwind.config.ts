import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";

const config = {
  darkMode: ["class", ""],
  content: [
    "./src/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/layout/*.{ts,tsx}",
    "./src/context/*.{ts,tsx}",
    "./src/components/**/**/*.{ts,tsx}",
  ],
  theme: {},
  plugins: [animatePlugin],
} satisfies Config;

export default config;
