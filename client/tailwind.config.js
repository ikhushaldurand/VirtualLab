/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#2563eb",
          "blue-dark": "#1d4ed8",
          red: "#dc2626",
          "red-dark": "#b91c1c",
        },
        lab: {
          blue: "#1E90FF",
          "blue-dark": "#187bcd",
          red: "#FF3B30",
          "red-dark": "#d62f27",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
