module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f6f1e8",
        panel: "#ffffff",
        line: "#e7e0d3",
        ink: "#2f2a25",
        muted: "#8a8378",
        brand: "#8d5f31",
        "brand-hover": "#744c27",
        danger: "#be4d4d",
        success: "#3b8f54"
      },
      fontFamily: {
        display: ["Cormorant Garamond", "serif"],
        sans: ["Manrope", "sans-serif"]
      },
      boxShadow: {
        soft: "0 0 0 3px rgba(141,95,49,0.08)"
      }
    }
  },
  plugins: []
};
