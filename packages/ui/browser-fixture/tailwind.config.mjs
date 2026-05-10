import { createSkeedTailwindPreset } from '@skeed/tailwind';

export default {
  content: {
    relative: true,
    files: ['./index.html', './src/**/*.{ts,tsx}', '../src/**/*.{ts,tsx}'],
  },
  presets: [createSkeedTailwindPreset({ demographic: 'health', tone: 'calm' })],
};
