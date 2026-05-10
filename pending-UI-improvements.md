# Pending UI Improvements - Skeed Component Audit

> **Audit Date**: 2026-04-27
> **Scope**: 66 archetype components in `data/archetypes/`
> **Categories**: Visual placeholders, inline SVG icons, missing loading states, accessibility gaps, incomplete implementations

---

## 1. Visual Placeholders (Gray Boxes)

Components with empty placeholder slots that render as generic gray boxes instead of meaningful illustrations or content.

| Component | Location | Issue | Severity |
|-----------|----------|-------|----------|
| **Hero** | `hero.archetype.tsx:79-83` | `hero_illustration` slot is empty div with `bg-skeed-color-neutral-100` and `min-h-skeed-spacing-10` - renders as gray rectangle | **High** |
| **ChatMessage** | `chat-message.archetype.tsx:26-34` | Avatar fallback is gray circle with just first letter - no proper default avatar illustration | Medium |
| **Comments** | `comments.archetype.tsx:28-35` | Same pattern as ChatMessage - gray circle with initial | Medium |
| **EmptyState** | `empty-state.archetype.tsx:47-54` | Requires external `illustration` prop - no built-in default illustration results in empty space | Medium |

**Root Cause**: Asset system `@skeed/asset-icon` and `@skeed/asset-logo-svg` exist but aren't utilized for default illustrations.

---

## 2. Inline SVG Icons (Not Using Asset System)

Components using inline SVGs instead of the centralized `@skeed/asset-icon` package. This creates inconsistency and maintenance burden.

### Form Components
| Component | Inline Icons | Missing Asset-Icon Import |
|-----------|--------------|---------------------------|
| **LoginForm** | Eye, EyeOff, Spinner | No import from `@skeed/asset-icon` |
| **SignupForm** | Eye, EyeOff, Spinner, Check | No import from `@skeed/asset-icon` |
| **ContactForm** | Spinner, Success | No import from `@skeed/asset-icon` |
| **PasswordReset** | None (should have email icon) | No icons at all |
| **SearchBar** | Search, X, Spinner | Uses 3 inline SVG components |
| **Select** | ChevronDown | Single inline SVG |

### Overlay Components
| Component | Inline Icons |
|-----------|--------------|
| **Modal** | Close X icon (lines 104-119) |
| **Dialog** | No close icon provided |
| **Drawer** | Close X icon (lines 176-188) |
| **Toast** | Dismiss X icon (lines 76-90) |
| **Popover** | No icons |

### Display Components
| Component | Inline Icons |
|-----------|--------------|
| **Alert** | Dismiss X icon (lines 48-62) |
| **Tag** | Remove X icon (lines 48-62) |
| **Stepper** | Checkmark for complete state (lines 59-72) |
| **ErrorState** | Error circle with exclamation (lines 52-65) |
| **Tree** | Chevron for expand/collapse (lines 201-218) |
| **Faq** | Chevron for expand/collapse (lines 64-81) |
| **Accordion** | Chevron for expand/collapse (lines 39-53) |
| **OnboardingStep** | Checkmark for complete (lines 43-57) |

### Complex Forms
| Component | Inline Icons |
|-----------|--------------|
| **FormDisclosure** | ChevronDown, ChevronRight (lines 18-27) |
| **FormGrouped** | ChevronDown, ChevronRight (lines 17-26) |

**Root Cause**: Components were built with inline SVGs for speed, but never refactored to use the asset system.

**Note**: Some components correctly use `@skeed/asset-icon`:
- `button.archetype.tsx` - imports `Spinner` from asset-icon
- `checkbox.archetype.tsx` - imports `Check`, `Minus` from asset-icon

---

## 3. Missing Loading States

Components that should have skeleton/loading variants but lack them entirely.

| Component | Current State | Needed |
|-----------|---------------|--------|
| **Card** | Static only | Skeleton variant for header, body, footer |
| **DashboardCard** | Has sparkline | Full card skeleton (title, value, change, sparkline) |
| **KpiGrid** | Static metrics | Skeleton cards for each metric |
| **FeatureGrid** | Static features | Skeleton with icon placeholder + text lines |
| **Testimonial** | Static quote | Skeleton for avatar, quote lines, author info |
| **PricingCard** | Static pricing | Skeleton for plan name, price, feature list |
| **TableRow** | Static row | Skeleton row with cell placeholders |
| **Comments** | Comment list | Skeleton comment items with avatar + text |
| **ChatMessage** | Message display | Skeleton message bubbles |
| **Hero** | Static content | Skeleton for headline, subtext, CTA, illustration area |
| **Header** | Static header | Skeleton for breadcrumb, title, actions |
| **Navbar** | Static nav | Skeleton for logo, links, actions |
| **Article** | Content only | Skeleton for title, subtitle, body paragraphs |

**Root Cause**: Focus on happy-path states; loading states weren't prioritized.

---

## 4. Accessibility Gaps

| Component | Issue | Location |
|-----------|-------|----------|
| **Tooltip** | CSS-only pattern lacks proper positioning, focus management, and screen reader announcements | `tooltip.archetype.tsx:26` |
| **Dropdown** | Empty `listbox` implementation - doesn't actually render items properly | `dropdown.archetype.tsx:29-31` |
| **FileUploader** | No drag-drop state feedback, no keyboard accessibility for file selection, missing `aria-live` for upload status | `file-uploader.archetype.tsx` |
| **Slider** | Custom-styled range input may have screen reader issues with value announcements | `slider.archetype.tsx:26-40` |
| **Pagination** | No "Page X of Y" announcement for screen readers | `pagination.archetype.tsx:14-75` |
| **CommandPalette** | No scroll-to-selected behavior when navigating with keyboard | `command-palette.archetype.tsx:141-175` |

---

## 5. Incomplete Implementations

| Component | What's Missing | Current State |
|-----------|----------------|---------------|
| **FileUploader** | File list display, upload progress, drag-drop visual feedback, error states for invalid file types | Just a styled drop zone with hidden input |
| **Dropdown** | Proper item rendering, keyboard navigation, active item highlighting | Empty `role="listbox"` div that doesn't render children |
| **CalendarDay** | Full calendar grid, month navigation, range selection | Single day button only |
| **Breadcrumb** | Truncation for long paths, mobile responsive behavior | Simple list with separators |
| **TableRow** | Full table composite (Table, Thead, Tbody, Th, Td), sorting indicators | Just a styled row |
| **Menu** | Submenu support, checkbox/radio items, dividers | Basic button list only |

---

## 6. Missing Motion/Exit Animations

Components with enter animations but missing exit animations or proper motion polish.

| Component | Enter | Exit | Issue |
|-----------|-------|------|-------|
| **Dialog** | None | None | Appears/disappears instantly |
| **Modal** | None | None | Appears/disappears instantly |
| **Popover** | `animate-in fade-in zoom-in-95` | None | No exit animation |
| **Toast** | `animate-in slide-in-from-right-full` | `animate-out slide-out-to-right-full` | ✓ Complete |
| **Drawer** | `transition-transform` | `transition-transform` | ✓ Has transform animation |
| **EmptyState** | None | None | Static appearance |
| **ErrorState** | None | None | Static appearance |
| **Faq** | None | None | Expand/collapse instant |
| **Accordion** | None | None | Expand/collapse instant |
| **Hero** | None | None | No entrance animation |

---

## Priority Summary

### High Priority (Affects Core UX)
1. **Hero illustration placeholder** - Gray box is very noticeable placeholder UI
2. **Inline SVG consolidation** - 20+ components need migration to `@skeed/asset-icon`
3. **Missing loading states** - Card, DashboardCard, KpiGrid, TableRow (data-heavy components)
4. **FileUploader completeness** - Currently unusable for production

### Medium Priority (Polish & Consistency)
5. **ChatMessage/Comments avatar fallbacks** - Gray circles with letters look unfinished
6. **EmptyState default illustration** - Should have built-in default
7. **Exit animations** - Popover, Dialog, Modal need exit transitions
8. **Dropdown implementation** - Currently non-functional shell

### Lower Priority (Nice to Have)
9. **Pagination** screen reader enhancements
10. **CommandPalette** scroll-to-selected behavior
11. **CalendarDay** expansion to full calendar composite
12. **Article** skeleton state

---

## Recommended Action Plan

1. **Immediate**: Replace Hero gray placeholder with actual illustration slot or remove it
2. **Week 1**: Migrate all inline SVGs to `@skeed/asset-icon` imports
3. **Week 2**: Add loading skeleton variants to data-heavy components (Card, DashboardCard, KpiGrid, TableRow)
4. **Week 3**: Complete FileUploader implementation
5. **Week 4**: Add exit animations and accessibility fixes

---

## Component Quality Scorecard

| Category | Components | Pass Rate |
|----------|------------|-----------|
| Uses Asset Icons | 66 total | 3% (2/66) |
| Has Loading State | 66 total | 8% (5/66) |
| Complete Implementation | 66 total | 85% (56/66) |
| Has Enter Animation | 66 total | 15% (10/66) |
| Has Exit Animation | 66 total | 8% (5/66) |

---

---

## 7. Infrastructure Issues (Deeper Analysis)

### 7.1 Asset Source Packages - All Unimplemented Stubs

**Critical Finding**: All 9 asset source packages are non-functional stubs that throw errors or return zero scores.

| Package | Location | Issue |
|---------|----------|-------|
| `asset-source-fal` | `src/index.ts:7-13` | `match()` returns `{score: 0, reason: 'not implemented'}`, `fetch()` throws Error |
| `asset-source-gemini-image` | `src/index.ts:7-13` | Same pattern - completely unimplemented |
| `asset-source-unsplash` | `src/index.ts:7-13` | Same pattern |
| `asset-source-pexels` | `src/index.ts:7-13` | Same pattern |
| `asset-source-replicate` | `src/index.ts:7-13` | Same pattern |
| `asset-source-openai-image` | `src/index.ts:7-13` | Same pattern |
| `asset-source-open-doodles` | `src/index.ts:7-13` | Same pattern |
| `asset-source-undraw` | `src/index.ts:7-13` | Same pattern |

**Impact**: The asset pipeline cannot fetch real illustrations/images. Hero placeholders and EmptyState illustrations cannot be populated.

---

### 7.2 LLM Provider Packages - All Unimplemented Stubs

**Critical Finding**: All 4 LLM provider packages are non-functional stubs.

| Package | Location | Issue |
|---------|----------|-------|
| `llm-provider-openai` | `src/index.ts:12-21` | `modelFor()` throws, `chat()` throws - 3 TODO comments |
| `llm-provider-anthropic` | `src/index.ts:12-21` | Same pattern - unimplemented |
| `llm-provider-google` | `src/index.ts:12-21` | Same pattern - unimplemented |
| `llm-provider-ollama` | `src/index.ts:12-21` | Same pattern - unimplemented |

**Impact**: The entire LLM routing and AI-powered features are non-operational.

---

### 7.3 Incomplete Icon Library

**Critical Finding**: `@skeed/asset-icon` only exports 5 icons but archetypes need 20+.

**Currently Available** (5 icons):
- `Eye`, `EyeOff`, `Check`, `Minus`, `Spinner`

**Missing Icons** (20+ needed by archetypes):
- Search, X/Close, ChevronDown, ChevronRight, ChevronUp
- Success/CheckCircle, Error/AlertCircle, Warning
- Email, Lock, User, Calendar, Upload
- Star, Heart, Share, MoreVertical, MoreHorizontal
- Trash, Edit, Plus, Minus (different from current), ArrowLeft, ArrowRight
- Home, Settings, Bell, Menu/Hamburger

**Root Cause**: The asset-icon package was started but never completed. Components resort to inline SVGs because the icons they need don't exist in the library.

---

### 7.4 Empty Packages

| Package | Issue |
|---------|-------|
| `scoring` | `src/index.ts` is empty with just comment: `// AGENTS: implement scoring entry points and export here.` |

---

### 7.5 Motion System Using Inline Styles (Not Tokens)

**File**: `packages/motion/src/enterprise/VisualSummary.tsx`

| Line | Issue |
|------|-------|
| 83-86 | Hardcoded inline styles: `background: 'white'`, `borderRadius: '12px'`, `border: '1px solid var(...)'` |
| 94 | Hardcoded padding: `padding: '20px 24px'` |
| 102-107 | Hardcoded typography sizes |
| 116-118 | **Inline SVG** for chevron icon (not using asset-icon) |
| 305, 407-408 | **Unicode arrows** (`↑`, `↓`, `→`) instead of icon components |

**Impact**: Motion components don't respect design tokens or demographic themes.

---

### 7.6 Guard System Detects Placeholders

**File**: `packages/guards/src/rubric.ts`

The rubric guard actively checks for placeholder content:
- Line 72: Checks for `placeholder|untitled` in alt text
- Line 84: Checks for `Lorem ipsum|placeholder|TODO` in landing TSX
- Line 25: Checks for placeholder email patterns

This confirms placeholder UI is a known, systemic issue throughout the codebase.

---

## Updated Priority Summary

### Critical (Blocking Production)
1. **Asset source packages** - 9 packages are stubs; no image/illustration pipeline
2. **LLM provider packages** - 4 packages are stubs; AI features non-operational
3. **Icon library** - Only 5 of 25+ needed icons exist

### High Priority
4. **Hero gray placeholder** - Most visible placeholder UI
5. **Inline SVG consolidation** - 20+ components need migration (blocked by #3)
6. **Missing loading states** - Data-heavy components lack skeletons
7. **FileUploader** - Non-functional shell

### Medium Priority
8. **Motion VisualSummary** - Uses inline styles instead of tokens
9. **Chat/Comment avatars** - Gray circle fallbacks
10. **EmptyState illustrations** - No default provided

---

## Root Cause Analysis

The pattern is clear: **The project was scaffolded with many packages and components, but the infrastructure layer was never completed.**

| Layer | Status |
|-------|--------|
| Component archetypes | ✓ Mostly complete (66 components) |
| Design tokens/CSS | ✓ Complete |
| Asset sources | ✗ 0% implemented (9 stubs) |
| LLM providers | ✗ 0% implemented (4 stubs) |
| Icon library | ⚠️ 20% complete (5/25 icons) |
| Motion system | ⚠️ Partial (works but uses wrong patterns) |
| Scoring/guards | ⚠️ Partial (guards work, scoring empty) |

**Recommendation**: Before fixing component-level UI polish, complete the infrastructure layer (asset sources, LLM providers, icon library). Otherwise components will continue using workarounds (inline SVGs, gray placeholders).

---

*Generated by comprehensive archetype audit. Focus on root causes, not symptoms.*
*Deep dive completed: infrastructure packages audited.*
