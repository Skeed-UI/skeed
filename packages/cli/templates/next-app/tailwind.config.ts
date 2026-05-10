import type { Config } from 'tailwindcss';
import { skeedTailwindPreset } from './skeed.tailwind';

export default {
  presets: [skeedTailwindPreset],
  content: {
    relative: true,
    files: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  },
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
