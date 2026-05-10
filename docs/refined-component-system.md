# Refined Component System Direction

Skeed should feel like a demographic-aware component studio, not a shadcn-style primitive shelf.
The baseline primitives still matter, but the catalog should win by combining:

- demographic fit: density, tone, motion, language, and accessibility posture adapt by preset
- AI metadata: every refined archetype should expose intent phrases, use cases, mood tags, style axes, interaction model, and generation hints
- polished defaults: components should ship with loading, empty, focus, disabled, hover, and reduced-motion-safe states where relevant
- expressive exclusives: Skeed should include memorable UI formats that generic libraries rarely provide

## Component Selection Heuristic

Use familiar primitives when the product needs speed, predictability, and repeated operational use.
Use exclusive components when the page needs emotion, ceremony, storytelling, assistant affordance, or guided choice.

| Need | Prefer |
| --- | --- |
| Standard data container | `Card` |
| Authored, treasured, ceremonial content | `Scroll` |
| Selectable options with descriptions | `ChoiceCardGroup` |
| Conversational message, quote, coach tip | `SpeechBubble` |
| AI prompt, dictation, hands-free command | `VoiceOrbInput` |
| Story/process tied to page progress | `ScrollTimeline` |
| Sections that unfold while reading | `ScrollAccordion` |
| Premium ambient accent or attention marker | `LuminousGlyph` |

## AI Metadata Fields

`aiMetadata.intentPhrases` powers retrieval from natural language requests.
`useCases` captures product contexts.
`moodTags` helps match brand voice and demographic psychology.
`styleAxes` lists safe visual variants the generator can choose from.
`interactionModel` tells composition whether a component is static, selectable, input-driven, scroll-reactive, or ambient.
`generationHints` encode judgement that should not live inside TSX.

## Refinement Bar

A refined Skeed component should satisfy these before it becomes a default recommendation:

- tokenized visual decisions with no product-specific hardcoding
- keyboard and screen-reader semantics for every interaction
- clear demographic/style levers exposed as props
- subtle micro-interactions using motion tokens and reduced-motion-safe classes
- graceful fallback when assets or AI providers are unavailable
- metadata rich enough for retrieval, ranking, and composition

## Current Seeded Exclusive Archetypes

- `scroll`: ancient/editorial alternative to card
- `choice-card-group`: dynamic selectable choice cards
- `speech-bubble`: speech/cloud bubble for messages and coach tips
- `voice-orb-input`: voice-first AI input with orb and waveform affordance
- `scroll-timeline`: scroll-driven narrative/process timeline
- `scroll-accordion`: accordion panels that can respond to page scroll
- `luminous-glyph`: diamond/star/light-bulb decorative light emitter
