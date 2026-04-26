# Health Demographic — Design System

The `health` demographic covers all patient-facing, caregiver-facing, and clinical applications built on the Skeed design system. This includes patient portals, wellness tracking apps, telehealth platforms, medication management tools, clinical dashboards, and electronic health record (EHR) interfaces.

---

## Who This Is For

| Application type | Primary users |
|---|---|
| Patient portals | Patients of all ages accessing their own records, appointments, and bills |
| Wellness tracking | General consumers monitoring fitness, sleep, nutrition, and mental health |
| Telehealth | Patients and providers communicating via video, chat, or async messaging |
| Medication management | Patients and caregivers managing prescriptions, refills, and adherence |
| Clinical dashboards | Nurses, physicians, and administrative staff under time pressure |
| Caregiving apps | Family members and professional caregivers managing another person's health |

Users span the full age range — including seniors with cognitive and motor impairments — and a wide spectrum of health literacy and digital literacy. Design decisions must serve all of them, not just the median user.

---

## Design Rationale

### Why clinical teal?

Teal (`#14B8A6` / brand-500) sits between green and blue — both of which carry strong health associations across cultures. It reads as calm, clean, and healing without the sterility of pure cool gray or the aggression of saturated red or orange. Brand-800 (`#115E59`) on white achieves a 7.7:1 contrast ratio (WCAG AAA), making it safe for all body text. Brand-700 (`#0F766E`) is AA-only and must not be used for body text.

### Why cozy density?

The default density is `cozy` (12px vertical padding, 1.6 line-height). This is intentional:

- Elderly users need larger tap targets and breathing room between elements.
- Patients who are ill, anxious, or in pain have reduced cognitive bandwidth — tight UIs increase errors.
- Caregivers are often multitasking and benefit from clear visual separation.
- Minimum tap target size is **48px** across all interactive elements, per WCAG 2.5.5 (AAA) and ADA guidance.

### Why soft borders?

`borders.treatment: "soft"` means border-radius steps are generous (8px–24px for cards, interactive elements). Sharp corners feel harsh and clinical in the negative sense. Soft rounding communicates warmth and approachability without sacrificing professionalism. It is also a documented trust cue for health users (see `psychology/patient.json`).

### Why no red for decoration?

Red is reserved exclusively for genuine clinical urgency (danger states, critical alerts). Using red for decorative UI elements — active nav highlights, brand accents, badges — causes measurable patient anxiety in health contexts. The `danger` palette (crimson-toned) is only applied to true error and emergency states.

### Why subtle motion?

Animations use `motion.profile: "subtle"` with maximum duration of 350ms. Patients using health apps may be anxious, medicated, or have vestibular disorders (dizziness triggered by excessive motion). All transitions must respect `prefers-reduced-motion`. No auto-playing animations, no looping decorative motion.

---

## Regulatory and Accessibility Context

### HIPAA UI Implications

While Skeed is a design system rather than a covered entity, all health-demographic components are built to HIPAA-adjacent UI standards:

- **No PHI in URLs**: Patient identifiers, record numbers, and health data must never appear in URL query strings or path segments. Use opaque session tokens or POST bodies.
- **No PHI in localStorage or sessionStorage**: Sensitive health data must not be persisted in browser storage. Use server-side session management.
- **No PHI in analytics events**: Event tracking (page views, clicks, errors) must strip or hash any patient-identifiable data before sending to analytics providers.
- **Session timeouts**: Sessions handling health data must time out after inactivity. The timeout warning must be an accessible modal (focus-trapped, keyboard-dismissible) with a visible countdown. Never silently expire a session.
- **Audit trails**: All reads and writes of health records should be logged server-side. The UI should surface "last accessed" timestamps where relevant.

### WCAG AAA (Mandatory)

This demographic enforces `accessibilityFloor: "AAA"`. All text must meet a **7:1 contrast ratio** minimum. All `contrastPairs` in `preset.json` have `passesAAA: true`. Two-reviewer SLA applies to all PRs (see `owners.md`).

Key AAA requirements in scope:
- **1.4.6 Contrast (Enhanced)**: 7:1 for normal text, 4.5:1 for large text (18pt+ or 14pt+ bold)
- **1.4.12 Text Spacing**: No loss of content when letter/word/line spacing is increased per WCAG thresholds
- **2.4.12 Focus Appearance**: Focus indicators meet AAA size and contrast requirements
- **2.5.5 Target Size**: Minimum 44×44px (AAA target: 44px; health demographic enforces 48px minimum)
- **3.1.5 Reading Level**: Plain language at grade 6–8 reading level for all patient-facing copy

### ADA / Section 508

All components must be operable by keyboard alone and compatible with common screen readers (NVDA, JAWS, VoiceOver, TalkBack). All form inputs require visible, persistent labels — no placeholder-as-label. Error messages must be specific, actionable, and associated with the relevant input via `aria-describedby`.

---

## What Makes Health UI Different

### Patient anxiety is real and must be designed for

Patients accessing health apps are often scared. Lab results, billing statements, and appointment reminders carry emotional weight. The UI must:

- Default to calm, neutral language — avoid alarmist framing
- Never use urgency timers or countdown clocks outside of genuine clinical time-sensitivity (e.g., medication reminders)
- Reserve the `danger` color palette strictly for clinical urgency, not UI decoration
- Provide human context alongside data (reference ranges, plain-language interpretations, CTA to contact care team)

### Plain language is a clinical safety requirement

Misunderstood medication instructions cause hospitalizations. All patient-facing copy must target grade 6–8 reading level. Medical jargon, Latin abbreviations (b.i.d., PRN, q.d.), and unexplained acronyms are forbidden in patient-facing surfaces. Use the tap-to-expand glossary pattern for any unavoidable clinical term.

### Emergency access must always be one tap away

Any flow that could surface a health-critical situation — symptoms, medications, lab results, mental health check-ins — must provide a persistent, visible emergency contact option. The standard label is "Call 911 for emergencies" (or local equivalent), never hidden behind a menu.

### Diverse ability is the baseline, not the edge case

The health demographic is explicitly designed for:
- Elderly users with reduced vision, motor control, and cognitive bandwidth
- Users with chronic conditions affecting cognition or motor function
- Users accessing the app while actively ill or in pain
- Caregivers operating under stress and time pressure
- Clinical staff using the app during high-workload moments

48px tap targets, generous line-height (1.6 default), and high-contrast color are non-negotiable defaults — not opt-in accommodations.

---

## Niche Coverage

| Niche | Psychology profile | Status |
|---|---|---|
| `patient` | `psychology/patient.json` | Complete |
| `wellness` | — | Planned |
| `clinical` | — | Planned |
| `caregiving` | — | Planned |
| `mental-health` | — | Planned |

Niches without a psychology profile inherit the `patient` profile defaults until a dedicated profile is authored.

---

## Anti-Patterns (Strictly Forbidden)

These patterns are prohibited across all health-demographic surfaces:

| Anti-pattern | Why |
|---|---|
| `pii-in-url` | PHI in URLs is logged by proxies, CDNs, and browsers — HIPAA risk |
| `pii-in-localStorage` | Browser storage is accessible to XSS and third-party scripts |
| `pii-in-analytics-events` | Analytics pipelines are not HIPAA-compliant by default |
| `urgency-timer` | Manufactured urgency causes patient anxiety and dark-pattern pressure |
| `fake-scarcity` | "Only 2 slots left" messaging is manipulative in healthcare |
| `auto-enrollment` | Patients must explicitly opt in to all programs and notifications |
| `pre-checked-consent` | Consent for data sharing must be explicit and unchecked by default |
| `hidden-data-sharing` | Any data sharing must be disclosed clearly before it occurs |
| `notification-spam` | Push notifications for health data must be opt-in and purposeful |
| `social-comparison` | "You're in the bottom 20% for steps" is harmful in health contexts |
| `countdown-timer` | Creates artificial urgency; also triggers anxiety in anxious patients |
| `autoplay-sound` | Patients may be in clinical settings or have auditory sensitivities |

---

## Two-Reviewer SLA

All PRs touching `data/demographics/health/` require:
1. One reviewer from `@skeed/health-domain-leads`
2. One reviewer from `@skeed/clinical-reviewers`

PRs must be tagged `aaa-strict` and `health-domain`. No exceptions. See `owners.md` for the full owner list and escalation path.
