# fintech — Demographic Design System

Financial application users: trading platforms, personal finance, retail banking, payments, expense management, and crypto. Adults 25–55, financially literate, expect dense information presentation and unambiguous UI.

---

## Who this demographic is

**Primary users:** Adults 25–55 with active financial lives — salaried professionals managing personal finance, small business owners tracking cash flow, active investors on trading platforms, and frequent payers using digital wallets or expense tools.

**What they share:** High stakes, low tolerance for ambiguity. A misread balance or a missing transaction status isn't just annoying — it can cost money. These users approach financial UI with earned skepticism. They will read fine print, hover over tooltips, and notice when a button label doesn't match the action it performs.

**What they do not share:** A single income bracket or technical sophistication level. The design system must work equally well for a casual savings account holder and a portfolio manager running multiple positions simultaneously. Density settings (`compact` default, `cozy`, `comfy`) allow product teams to tune for their specific niche without forking the system.

---

## Design rationale

### Cobalt blue — not navy, not sky
Cobalt blue (#3B82F6 at 500, #1D4ED8 at 700) is the brand anchor. It reads as professional and trustworthy without the stiffness of traditional banking navy or the approachability of consumer-app sky blue. It pairs cleanly with blue-gray slate neutrals. The palette avoids warm hues — financial UI should feel precise, not welcoming.

### Compact density by default
Every pixel earns its place. Data tables are the primary UI surface in finance, not marketing cards. `defaultDensity: "compact"` (padY:4, padX:8) reflects that users expect to see more rows, not more whitespace. Cozy and comfy variants exist for onboarding flows and confirmation screens where breathing room reduces error rates.

### Hard borders (treatment: "hard")
Sharp edges communicate precision. Rounded corners signal friendliness and approachability — appropriate for kids or wellness apps, wrong signal for a trading dashboard or bank statement. Hard-edged containers, 1px borders, and no decorative drop shadows keep the visual language grounded in precision instruments.

### Subtle motion only
Animations in financial UI must never distract from the data. `motion.profile: "subtle"` caps transitions at 300ms with ease-in-out curves. No bounce, no spring, no celebration animations on payment confirmations (these can mask errors and feel manipulative). Enter/exit transitions exist to maintain spatial orientation, not to delight.

### JetBrains Mono for all numerics
Monospaced tabular numerals (`tnum` feature flag, `zero` for disambiguating 0/O) are non-negotiable for financial amounts. Proportional fonts cause columns to shift as values change and make it easy to misread digit sequences. Every currency amount, account number, transaction ID, and percentage displayed in this system uses the `numeric` font stack.

### Line iconography (Lucide)
Line-style icons at consistent 1.5px stroke weight read clearly at the small sizes demanded by compact density. Filled or illustrated icons carry personality weight that competes with data. Lucide's financial icon coverage (arrow-up-right, trending-up, shield, landmark, receipt, wallet) maps well to common fintech use cases.

---

## Regulatory context

### WCAG 2.1 AA (minimum floor)
All components in this demographic target WCAG 2.1 Level AA as the accessibility floor. This means:
- 4.5:1 contrast ratio for normal text, 3:1 for large text and UI components
- All interactive elements operable via keyboard
- No information conveyed by color alone (status indicators require an icon or label, not just red/green)
- Touch targets meet WCAG 2.5.8 (AA, 24×24px minimum) — components should aim for 44×44px for primary actions given commute-context usage

The system's contrast pairs (#0F172A on #F8FAFC at 17.2:1, #FFFFFF on #1D4ED8 at 8.8:1) exceed AA by a wide margin and pass AAA for normal text.

### CFPB design implications
The Consumer Financial Protection Bureau's design and disclosure guidelines shape several component-level decisions:
- Fee amounts must be disclosed before action commitment, not at a confirmation screen that functions as a rubber stamp
- Error messages for payment declines must include the reason and a recovery path (Regulation E alignment)
- Opt-in default states: no pre-checked consent boxes, no auto-enrollment in paid tiers
- APR and interest rate display must not use visual tricks (small print, muted color, secondary position) to de-emphasize cost

### PCI-DSS UI implications
PCI-DSS v4.0 does not impose specific color or contrast requirements on UI beyond standard accessibility law. However, it does require:
- Card number fields must mask input after entry (show last 4 only)
- CVV fields must never persist or be pre-filled
- Payment pages must visually distinguish themselves from non-payment pages (helps users recognize scope)

These are component-level constraints captured in individual component specs, not in the preset.

---

## What makes fintech UI different

**Audit trail visibility.** Users need to believe there is a ledger of record. Every action that moves money should produce a visible, referenceable record: a transaction ID, a timestamp, a confirmation number. These are not just UX niceties — they are the mechanism by which users resolve disputes and verify correctness.

**Numeric precision over visual polish.** A beautifully designed balance display that uses a proportional typeface is worse than an ugly one that uses monospaced tabular figures. Get the numbers right first.

**Error specificity.** Generic errors ("Something went wrong") are acceptable in many product categories. In financial UI they are a trust-destroying failure. Every error state must tell the user what happened, why, and what to do next. "Payment declined — insufficient funds. Available balance: $42.17. Try a smaller amount or add funds." is the standard to meet.

**Reversibility signals.** Irreversible actions (wire transfers, account closures, large payments) require explicit multi-step confirmation with a summary of what will happen, not just "Are you sure?". Reversible actions (scheduled payments, saved drafts) should be clearly marked as such.

**No dark patterns.** This demographic is explicitly governed by the `forbiddenPatterns` field in psychology profiles. Hidden fee disclosure, misleading APR display, fake urgency, pre-checked consent, and dark-nudge overdraft flows are prohibited regardless of business pressure to implement them.

---

## Niche coverage

| Niche | Psychology file | Pain-points file | Notes |
|---|---|---|---|
| banking | `psychology/banking.json` | `pain-points/banking.json` | Retail banking, savings, checking |
| trading | — | — | Planned: equities, options, crypto trading platforms |
| expense-management | — | — | Planned: corporate card, receipt capture, approval flows |
| payments | — | — | Planned: P2P, bill pay, international transfer |
| crypto | — | — | Planned: wallet, exchange, DeFi interfaces |

Psychology files capture the cognitive and motivational profile for a niche. Pain-points files capture documented usability failures with evidence citations. Niches without files inherit the demographic-level defaults from `preset.json`.

---

## Design resources

- [CFPB Design System](https://cfpb.github.io/design-system/) — US federal consumer finance regulator's own open-source component library; useful reference for disclosure patterns and form design
- [Nielsen Norman Group — Banking UX](https://www.nngroup.com/topic/banking/) — research articles on financial UX trust, error handling, and mobile banking
- [Lucide Icons](https://lucide.dev/) — the icon pack used in this demographic; filter by "finance" category
- [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) — display typeface; review OpenType feature `ss01` (alternate a) and `tnum` (tabular figures)
- [JetBrains Mono](https://www.jetbrains.com/lp/mono/) — numeric and mono typeface; `zero` feature disambiguates zero from capital O
- [Baymard Institute — Financial UX Research](https://baymard.com/blog/financial-ux) — checkout and payment form usability benchmarks
- [WCAG 2.1](https://www.w3.org/TR/WCAG21/) — accessibility standard; AA is the floor for this demographic
- [PCI-DSS v4.0 Requirements](https://www.pcisecuritystandards.org/document_library/) — payment card industry security standard
