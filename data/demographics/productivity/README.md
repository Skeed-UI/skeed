# Productivity — Design System Demographic

This demographic covers applications that help knowledge workers get things done: task managers, project management tools, note-taking apps, calendar and scheduling tools, time trackers, and focus/deep-work utilities.

---

## Who this is for

**Primary users**: Knowledge workers, freelancers, indie hackers, and small-to-mid-size teams. Age band 22–45. Already comfortable with software — these are not first-time app users.

**Use contexts**:
- Task managers (personal GTD, team to-dos, inbox-zero workflows)
- Project management (kanban, roadmaps, sprints, milestones)
- Note-taking and knowledge bases (second brain, wikis, daily journals)
- Time tracking (billable hours, focus sessions, Pomodoro timers)
- Email clients and triage tools (batched sending, snooze, send-later)
- Focus and deep-work tools (distraction blockers, session timers, ambient sound)

These users spend **hours per day** inside these apps. The design system is optimised for long-session comfort, not first-impression wow.

---

## Design rationale

### Why indigo / violet as the brand color

Indigo sits between blue (trust, calm, focus) and violet (creativity, intelligence, energy). It signals "this tool is smart and purposeful" without the aggression of red or the coldness of pure blue. It is the palette of Linear, Notion, and early Todoist — products that have earned deep trust with exactly this user group. The 500-step `#6366F1` provides a vivid primary action color while the 700-step `#4338CA` and 800-step `#3730A3` carry text on light backgrounds at 7.2:1 and 9.1:1 contrast ratios respectively.

### Why cozy density is the default

Compact density is appropriate for data-dense dashboards where horizontal space is the constraint (think spreadsheets or terminal UIs). Comfy density suits onboarding flows and marketing pages. Cozy sits between them: `padY:10 padX:14 gap:10 lineHeight:1.5`. It keeps related items visually grouped without cramming — comfortable for reading long task lists or note content without inducing fatigue. Users can opt up to comfy (accessible, relaxed) or down to compact (power-user mode) via their density preference.

### Why soft borders

Hard borders (high-contrast outlines) create visual noise that accumulates into cognitive fatigue over long sessions. Zero borders (borderless cards) work for low-density consumer apps but lose structure in information-dense views. Soft treatment — 1px solid border at low opacity using the purple-tinted neutral ramp — defines regions clearly without adding visual weight. The result is an interface that feels structured but breathable.

### Why subtle motion

Motion in productivity tools must reinforce direct manipulation without becoming a distraction. Duration fast:150ms handles micro-interactions (checkbox tick, button press). Normal:250ms handles state transitions (panel open, tab switch). Slow:400ms handles layout shifts (sidebar collapse, modal enter). There is no bounce — bouncy spring physics suggest playfulness, which breaks the focused, professional register of these tools. All easings follow material-style curves: snappy enter, smooth exit.

### Why line-style iconography (Lucide)

Line icons are unambiguous and professional. They read clearly at 16px and 20px (the two dominant sizes in productivity UI). Filled/glyph icons can feel heavy at small sizes and lose meaning when filled areas merge with colored backgrounds. Lucide specifically has a consistent 2px stroke weight and pixel-aligned grid that eliminates visual inconsistency across icon sets.

### Why DM Sans for display and Inter for body

DM Sans has humanist proportions with slightly geometric letterforms — it carries titles and headings with authority without feeling corporate. Inter is the workhorse body font: optimised for screen rendering at 13–16px, widely available, and highly legible across OS rendering pipelines. JetBrains Mono handles code, time values, and numeric data with tabular figures enabled (`tnum`) so columns align without JavaScript layout tricks.

---

## What makes productivity UI different

### Flow state preservation

Users enter deep work sessions that last 30–90 minutes. Every modal dialog, every notification badge, every unsolicited animation is a potential flow-state break. The design system enforces:

- Inline editing over modal dialogs wherever possible
- Optimistic UI updates (show the result immediately, sync in background)
- Keyboard-first interaction (every primary action reachable without a mouse)
- Notification controls surfaced prominently — users must be able to silence everything

### Keyboard-first

Tab order, focus rings, and keyboard shortcut discoverability are treated as first-class features, not afterthoughts. Focus rings use the brand indigo at 3px offset so keyboard users can track position without the ring obscuring content.

### Optimistic UI

Network latency must never block a user from marking a task complete, creating a new item, or reordering a list. UI updates immediately; the server confirms in the background. Failures surface as gentle, undismissable toasts — never as blocking error dialogs.

### Empty states as invitations

An empty task list is not a failure state — it is a fresh start. Empty states use encouraging copy ("Nothing here yet — add your first item") and a single, clear call-to-action. They never guilt-trip or imply the user is behind.

### Progress visibility

Completion counters, progress bars, and "done today" summaries are intrinsically motivating per Teresa Amabile's Progress Principle. The design system encourages their use in navigation sidebars and dashboard widgets. They should reflect actual work done, never gamified streaks or social leaderboards.

---

## Niche coverage

| Niche | Psychology profile | Pain points |
|---|---|---|
| task-management | `psychology/task-management.json` | `pain-points/task-management.json` |
| project-management | — planned — | — planned — |
| note-taking | — planned — | — planned — |
| time-tracking | — planned — | — planned — |
| email | — planned — | — planned — |

Start with task-management; it is the canonical niche that sets the tone for all others in this demographic.

---

## Accessibility

**Floor: WCAG 2.1 AA** (not AAA-strict).

- All text-on-background pairs in `contrastPairs` meet AA (4.5:1 for normal text, 3:1 for large text and UI components).
- Primary brand action pairs (#FFFFFF on #4338CA, ratio 7.2:1) comfortably exceed AA and meet AAA.
- Focus indicators are visible at keyboard navigation (3px indigo outline, 2px offset).
- Touch targets are a minimum 44×44px on cozy density.
- Motion respects `prefers-reduced-motion`: all transitions collapse to instant when the OS preference is set.
- This demographic does not require AAA compliance. However, strong accessibility practice is expected throughout — shortcuts, screen reader labels, and semantic HTML are non-negotiable.

---

## Forbidden anti-patterns

The following patterns are explicitly prohibited in any component scaffold generated for this demographic:

| Pattern | Why |
|---|---|
| `notification-spam` | Interrupts flow state — the very thing the tool is supposed to support |
| `streak-shaming` | Guilt-based retention erodes trust and causes anxiety |
| `social-comparison-pressure` | Leaderboards and "X users completed more than you" copy harm wellbeing |
| `fake-urgency` | Countdown timers and artificial scarcity cheapen the product |
| `autoplay-sound` | Unexpected audio in a work context is immediately uninstalled |
| `dark-pattern-upsell` | Hiding downgrade, pre-checking paid tiers, disguising ads as content |
| `guilt-tripping-copy` | "You haven't opened the app in 3 days" is not encouragement |

The guards module will reject any component that triggers these patterns at scaffold time.

---

## Sources and references

- Nielsen Norman Group — [Productivity Tools UX](https://nngroup.com/articles/productivity-tools-ux/)
- The Verge — [Linear project management review](https://www.theverge.com/23178813/linear-project-management-review)
- Todoist — [Productivity methods](https://todoist.com/productivity-methods)
- Teresa Amabile & Steven Kramer — *The Progress Principle* (Harvard Business Review Press, 2011)
- Gloria Mark (UC Irvine) — attention recovery research, cited in *Attention Span* (2023)
- Asana — Anatomy of Work Index (annual)
- Microsoft WorkLab — [Hybrid Work Research](https://www.microsoft.com/en-us/worklab/)
