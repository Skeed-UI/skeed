import type { Config } from 'tailwindcss';
import { skeedTailwindPreset } from './skeed.tailwind';

export default {
  presets: [skeedTailwindPreset as unknown as Partial<Config>],
  content: {
    relative: true,
    files: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  },
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
