import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        slide: "slide 20s linear infinite",
        "slide-slow": "slide 30s linear infinite",
      },
      keyframes: {
        slide: {
          "0%": { backgroundPosition: "0px 0px" },
          "100%": { backgroundPosition: "-1000px 0px" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
