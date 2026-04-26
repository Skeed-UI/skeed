# gov — Government & Civic Design System

The `gov` demographic covers civic tech builders, government agencies, public sector UX teams, and any product deployed in a public-facing government context. This is the widest possible demographic: every citizen — from a 5-year-old with a parent, to an 85-year-old with low vision, to a non-English speaker using a screen reader.

## Who This Is For

- **Civic tech builders** shipping public-benefit applications, digital services, and open government tools
- **Government agencies** modernizing legacy portals, permit systems, benefits applications, and municipal websites
- **Public sector UX teams** working within USWDS, GOV.UK Design System, or equivalent national design system constraints
- **Contractors and vendors** building on government contracts subject to Section 508 and WCAG AAA requirements

## Niches

| Niche | Examples |
|---|---|
| `civic` | Benefits applications, permit requests, tax filing, public records requests |
| `benefits` | Social services, SNAP, Medicaid, housing assistance |
| `permits` | Business licensing, building permits, zoning applications |
| `elections` | Voter registration, polling location lookup, election results |
| `public-records` | FOIA requests, court records, property records |

## Design Rationale

### WCAG AAA — Not Optional

Government services are mandated by law to serve everyone. WCAG AAA (7:1 contrast ratio for all text) is the floor, not a stretch goal. The populations most dependent on government services — elderly citizens, people with disabilities, low-income users on older devices — are also the populations most harmed by inaccessible design.

### No Motion

Motion is disabled by default (`profile: "none"`, all durations set to `0`). This is not a stylistic choice — it is a medical necessity. Vestibular disorders, epilepsy, and migraine sensitivity affect millions of citizens. WCAG 2.3 requires that animations not cause seizures. For government UI, the safest path is no motion at all unless the user explicitly opts in.

### Plain Language

Tone is plain, direct, helpful, and neutral. All copy targets a grade 8 Flesch-Kincaid reading level per the Plain Writing Act of 2010. Legal jargon, passive voice, and unexplained acronyms are forbidden.

### USWDS Navy

Brand color is USWDS-inspired deep navy (`#0E4D93`, ~8.5:1 on white — AAA). Navy reads as institutional and neutral across partisan lines. It is distinct from any political party color in the US, EU, and UK contexts.

### Hard Borders, Flat Surfaces

Border treatment is `hard` (sharp corners, 2px solid stroke). Rounded corners signal playfulness and consumer brand warmth — neither appropriate for government. Flat surface treatment eliminates decorative depth that adds visual noise without information value.

### Cozy Density

Default density is `cozy` (padY:12, padX:16, lineHeight:1.6). Compact density is inappropriate for the wide age range and reading ability range of government users. Line height of 1.6 measurably improves readability for dyslexic users and older readers.

## Regulatory Context

| Standard | Scope | Key Requirement |
|---|---|---|
| **WCAG 2.1 AAA** | All digital content | 7:1 contrast, no timing limits, no seizure triggers |
| **Section 508** | US federal agencies and vendors | Equivalent access for users with disabilities |
| **ADA Title II** | US state and local government | No discrimination in digital services |
| **EU EN 301 549** | EU public sector websites and apps | Harmonized accessibility standard (references WCAG 2.1 AA+) |
| **UK GDS / PSBAR** | UK public sector | Public Sector Bodies Accessibility Regulations |
| **Plain Writing Act (US)** | US federal agencies | Grade-appropriate plain language in all public communications |

## What Makes Gov UI Different

### Universal Design

Every design decision must work for the full population spectrum — not just the median user. Tap targets must be at least 44×44px (WCAG 2.5.5). Text resize to 200% must not break layout. Color must never be the sole indicator of status.

### Multi-Step Forms

Long government forms must show a clear step indicator, allow saving progress, and confirm completion with a reference number. Error messages must appear both at the top of the form (summary) and inline next to each field. Required fields must be labeled, not assumed.

### Identity Proofing

Many government services require identity verification. UI must not introduce dark patterns during identity steps — pre-checked consent boxes, confusing cancellation flows, and hidden data-sharing disclosures are illegal in many jurisdictions and forbidden by this design system.

### Session Management

Sessions must warn users before timeout with an accessible modal (keyboard-focusable, announced by screen readers). Timeout warning must appear at least 2 minutes before expiry. On expiry, submitted data must not be silently lost.

### Accessibility-First Development

- All interactive elements navigable by keyboard alone
- Focus indicators visible at 3:1 contrast against adjacent colors (WCAG 2.4.11)
- Skip-navigation links on every page
- ARIA landmarks on all page regions
- Form labels programmatically associated with inputs (never placeholder-only)
- Error messages associated with inputs via `aria-describedby`

## AAA-Strict Two-Reviewer SLA

This demographic is tagged `aaa-strict`. All PRs require **two reviewers**:

1. One reviewer from `@skeed/gov-domain-leads` (government UX / policy domain knowledge)
2. One reviewer from `@skeed/a11y-reviewers` (WCAG AAA and assistive technology expertise)

No exceptions. PRs must be tagged `aaa-strict` and `gov-domain`.

## Reference Links

- [U.S. Web Design System (USWDS)](https://designsystem.digital.gov/)
- [GOV.UK Design System](https://design-system.service.gov.uk/)
- [Section 508 — US Access Board](https://www.section508.gov/)
- [WCAG 2.1 — W3C](https://www.w3.org/WAI/WCAG21/quickref/)
- [Plain Language Guidelines — plainlanguage.gov](https://plainlanguage.gov/guidelines/)
- [EU EN 301 549](https://www.etsi.org/deliver/etsi_en/301500_302000/301549/)
- [ADA Title II Digital Accessibility Rule](https://www.ada.gov/resources/2024-03-08-web-rule/)
