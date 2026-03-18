import type { Config } from "tailwindcss"
import sharedConfig from "@zayka/config/tailwind"

const config = {
  ...sharedConfig,
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
} satisfies Config

export default config
