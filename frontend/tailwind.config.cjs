/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f5efe4", // soft beige
        "text-main": "#1f3b2c", // dark green
        "accent-primary": "#e08a3d", // warm orange
        "accent-secondary": "#8b5a2b", // earth brown
        "grid-deep": "#214434" // deep green
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif"
        ],
        mono: [
          "SF Mono",
          "Monaco",
          "Inconsolata",
          "Roboto Mono",
          "Courier New",
          "monospace"
        ]
      },
      fontSize: {
        "display-lg": ["3rem", { lineHeight: "1.1", letterSpacing: "0.05em" }],
        "display": ["2.5rem", { lineHeight: "1.2", letterSpacing: "0.05em" }]
      },
      boxShadow: {
        soft: "0 14px 30px rgba(0,0,0,0.08)",
        "soft-sm": "0 4px 12px rgba(0,0,0,0.05)",
        "soft-md": "0 8px 20px rgba(0,0,0,0.06)"
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "radar-sweep": "radarSweep 4s linear infinite"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
        radarSweep: {
          "0%": { transform: "translateY(-50%) rotate(0deg)" },
          "100%": { transform: "translateY(-50%) rotate(360deg)" }
        }
      }
    }
  },
  plugins: []
};

