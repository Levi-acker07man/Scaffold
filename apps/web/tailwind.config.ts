import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: 'var(--color-void)',
        'void-2': 'var(--color-void-2)',
        panel: 'var(--color-panel)',
        'panel-2': 'var(--color-panel-2)',
        'panel-border': 'var(--color-panel-border)',
        text: {
          DEFAULT: 'var(--color-text)',
          dim: 'var(--color-text-dim)',
          dimmer: 'var(--color-text-dimmer)',
        },
        accent: {
          base: 'var(--accent-base)',
          bg: 'var(--accent-bg)',
          border: 'var(--accent-border)',
          shadow: 'var(--accent-shadow)',
        },
        clay: {
          bg: 'var(--clay-bg)',
          border: 'var(--clay-border)',
        }
      },
      fontFamily: {
        mono: ['SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'clay': '6px 6px 12px rgba(0,0,0,0.08), inset -6px -6px 12px rgba(255,255,255,0.7), inset 6px 6px 12px rgba(0,0,0,0.04)',
        'clay-sm': '3px 3px 6px rgba(0,0,0,0.06), inset -3px -3px 6px rgba(255,255,255,0.5), inset 3px 3px 6px rgba(0,0,0,0.03)',
        'clay-active': 'inset 4px 4px 8px rgba(0,0,0,0.08), inset -2px -2px 6px rgba(255,255,255,0.4)',
      },
    },
  },
  plugins: [],
};
export default config;
