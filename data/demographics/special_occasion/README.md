# Special Occasion

The viral category. Lets the host generate beautiful one-off event sites with a chosen *taste* (palette + animation + RSVP style + ambient music).

## Niches
- `wedding` — most demanding aesthetically; default `classic_premium` taste.
- `birthday` — playful; default `wild_open`.
- `webinar` — credible; default `moderate_solemn`.
- `anniversary` — story-led; default `classic_premium`.
- `gathering` — generic catch-all (dinner, housewarming, reunion, baby shower); default `open_moderate`.

## Tastes
See `tastes.json`. Each taste defines palette, motion, animation, illustration_style, music_genre, rsvp_style.

Available tastes:
- `classic_standard`, `classic_premium`, `classic_super_closed`
- `open_moderate`, `wild_open`, `wild_closed`, `wild_rock`
- `moderate_solemn`, `game_night`, `just_vibe`

## RSVP defaults
Email-only form → CSV export emailed to host hourly (or per entry, configurable). No third-party guest tracking. Private by default.

## Music
Lazy-loaded background playlist. Royalty-free clips chosen per taste. Volume off by default; one-tap toggle. Honors `prefers-reduced-motion` (auto-mute).
