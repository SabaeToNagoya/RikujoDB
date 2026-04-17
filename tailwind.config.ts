import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1D9E75",
          dark: "#0F6E56",
          light: "#9FE1CB",
          bg: "#E1F5EE",
        },
      },
    },
  },
  plugins: [],
};
export default config;
