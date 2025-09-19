import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./i18n/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
export default config;
