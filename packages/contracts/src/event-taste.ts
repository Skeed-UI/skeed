import { z } from 'zod';

export const EventTaste = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  palette: z.object({
    primary: z.string(),
    accent: z.string(),
    bg: z.string(),
  }),
  motion: z.enum(['calm', 'cinematic', 'playful', 'dramatic']),
  fontStack: z.array(z.string()).min(1),
  illustrationStyle: z.string(),
  musicGenre: z.string(),
  rsvpStyle: z.enum([
    'form-only',
    'form-with-meal-prefs',
    'form-with-questions',
    'passcode-required',
    'invite-token',
    'rapid-tap',
    'tap-with-team',
    'free-form',
  ]),
});
export type EventTaste = z.infer<typeof EventTaste>;

export const EventTastesFile = z.object({
  schemaVersion: z.literal(1),
  demographic: z.string(),
  tastes: z.array(EventTaste).min(1),
});
export type EventTastesFile = z.infer<typeof EventTastesFile>;
