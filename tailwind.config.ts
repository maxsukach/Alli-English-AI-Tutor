import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  content: [
    // app
    "./src/app/**/*.{ts,tsx,js,jsx}",
    "./src/pages/**/*.{ts,tsx,js,jsx}",
    "./src/components/**/*.{ts,tsx,js,jsx}",
    // styles
    "./src/styles/**/*.{css,scss}",

    // Untitled UI packages (installed from npm or local)
    "./node_modules/@untitledui/**/*.{ts,tsx,js,jsx}",
    "./node_modules/@untitledui/icons/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {},
  },
  presets: [],
  plugins: [typography, tailwindcssAnimate],
};

export default config;
