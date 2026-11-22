/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          500: "#1D7AFC",
          600: "#0284C7",
          700: "#0369A1",
          900: "#0F172A",
        },
      },
      boxShadow: {
        soft: "0 16px 36px -10px rgba(15, 23, 42, 0.10), 0 4px 12px -2px rgba(29, 122, 252, 0.06)",
        card: "0 8px 24px -6px rgba(15, 23, 42, 0.07), 0 2px 6px -1px rgba(15, 23, 42, 0.04)",
        blueglow: "0 12px 28px -6px rgba(29, 122, 252, 0.35)",
      },
    },
  },
  plugins: [],
};
