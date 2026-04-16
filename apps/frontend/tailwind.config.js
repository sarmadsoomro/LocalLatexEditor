/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          light: "var(--color-primary-light)",
          dark: "var(--color-primary-dark)",
          50: "var(--color-primary-50)",
          100: "var(--color-primary-100)",
          200: "var(--color-primary-200)",
          900: "var(--color-primary-900)",
        },
        cta: {
          DEFAULT: "var(--color-cta)",
          light: "var(--color-cta-light)",
          dark: "var(--color-cta-dark)",
        },
        background: "var(--color-background)",
        surface: {
          DEFAULT: "var(--color-surface)",
          hover: "var(--color-surface-hover)",
        },
        heading: "var(--color-text)",
        secondary: "var(--color-text-secondary)",
        muted: "var(--color-text-muted)",
        border: {
          DEFAULT: "var(--color-border)",
          light: "var(--color-border-light)",
        },
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "monospace"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      transitionDuration: {
        fast: "100ms",
        base: "150ms",
        slow: "200ms",
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "slide-in": "slideIn 200ms ease-out",
        "pulse-soft": "pulse 2s ease-in-out infinite",
        "shimmer": "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      boxShadow: {
        primary: "0 4px 14px 0 rgba(15, 23, 42, 0.25)",
        cta: "0 4px 14px 0 rgba(3, 105, 161, 0.25)",
        "soft-xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};
