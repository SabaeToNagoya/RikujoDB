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
          DEFAULT: "#06b6d4",
          dark: "#0891b2",
          light: "#67e8f9",
          bg: "#0c2f38",
        },
      },
    },
  },
  plugins: [],
};
export default config;
