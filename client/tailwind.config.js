/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#16211D",
          700: "#3F4C46",
          500: "#6B7A73",
          300: "#A2AFA9",
        },
        paper: {
          DEFAULT: "#FBFBF9",
          alt: "#F2F5F2",
        },
        line: "#DEE5E1",
        brand: {
          50: "#E8F5F0",
          100: "#CFEBE0",
          200: "#9FD6C0",
          400: "#2E9179",
          500: "#1C7A64",
          600: "#155E4F",
          700: "#0F4A3F",
          900: "#0A332B",
        },
        gold: {
          50: "#FDF3DC",
          100: "#FBE7B8",
          400: "#E3A008",
          500: "#C98B0B",
          600: "#B7791F",
        },
        danger: {
          50: "#FBEAE9",
          500: "#B3261E",
        },
        info: {
          50: "#EAF1FA",
          500: "#2563EB",
        },
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        sans: ["Karla", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(22,33,29,0.06), 0 8px 24px -12px rgba(22,33,29,0.14)",
        lift: "0 4px 10px rgba(22,33,29,0.08), 0 16px 32px -16px rgba(22,33,29,0.18)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
}
