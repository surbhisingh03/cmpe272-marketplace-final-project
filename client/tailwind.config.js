/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        hub: {
          bg: "#0B1120",
          surface: "#111827",
          violet: "#7C3AED",
          cyan: "#06B6D4",
          pink: "#EC4899",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Poppins", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow:
          "0 0 80px -20px rgba(124, 58, 237, 0.55), 0 25px 50px -25px rgba(6, 182, 212, 0.25)",
        glowSm: "0 0 40px -10px rgba(124, 58, 237, 0.4)",
      },
      backgroundImage: {
        hubMesh:
          "radial-gradient(1200px 600px at 10% -10%, rgba(124,58,237,0.35), transparent 55%), radial-gradient(900px 480px at 90% 20%, rgba(6,182,212,0.28), transparent 50%), radial-gradient(700px 400px at 50% 100%, rgba(236,72,153,0.18), transparent 45%)",
      },
      keyframes: {
        floatSlow: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        floatSlow: "floatSlow 6s ease-in-out infinite",
        shimmer: "shimmer 8s linear infinite",
      },
    },
  },
  plugins: [],
};
