/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // Scan for Tailwind classes
  ],
  theme: {
    extend: {
      colors: {
        primary: "#00B03",
        secondary: "#EF863E",
      },
      backgroundImage: {
        "login-bg-img": 'url("./src/assets/Login.png")',
      },
    },
  },
  plugins: [],
};
