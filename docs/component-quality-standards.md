# Skeed Component Quality Standards

## Unique Value Proposition

Skeed components are designed with **demographic-awareness** and **psychology-driven design** at their core. Every component carries implicit metadata about who it's for and why it works for that audience.

## Quality Pillars

### 1. Demographic-Aware Design
- **Demographic presets** with tailored color psychology, typography, hierarchy, CTA weight, and motion
- Components adapt visual density (compact/comfy/cozy) based on audience needs
- Age-appropriate accessibility (kids vs enterprise vs healthcare)

### 1.1 Visual Hierarchy Defaults
- Every page shell should begin with `skeed-type-page`
- Every primary hero should use one dominant `skeed-type-hero`
- Section labels should use `skeed-eyebrow`, not ad hoc badge styles
- Primary and secondary CTAs should use `skeed-cta-primary` and `skeed-cta-secondary`
- Avoid making cards, badges, gradients, and buttons compete for the same visual priority
- Default typography presets must cover niche categories such as `kids`, `classic`, `legal`, `ai_apps`, `fintech`, `marketplace`, `gov`, and `clinical`

### 2. Token-Based Architecture
- **Zero hard-coded values** - all spacing, colors, typography via semantic tokens
- Automatic contrast validation per demographic (AA/AAA)
- Theme switching without component changes

### 3. Accessibility-First
- Full keyboard navigation on all interactive components
- ARIA roles, states, and properties properly implemented
- Screen reader tested with live regions for feedback
- Focus management in overlays (restoration, trapping)

### 4. Production-Ready Polish
- Loading states on all data-bound components
- Error boundaries and empty states
- Character counting with real-time validation
- Animated transitions (150-300ms) for all state changes

### 5. Form Experience
- react-hook-form compatible without wrappers
- Success/error/loading states with visual feedback
- Hint text and field-level validation

## Component Categories

### Primitives
Button, Badge, Avatar, Separator, Label, Kbd, Link, Spinner, Skeleton

**Standards:**
- Strict TypeScript (zero `any`)
- Proper ref forwarding
- Consistent loading states

### Form Components
Input, Textarea, Select, Checkbox, Radio, Switch

**Standards:**
- Label association (`useId` + `htmlFor`)
- `aria-invalid`, `aria-describedby` for errors
- `aria-busy` for loading states
- Character count with danger threshold

### Overlays
Dialog, Modal, Drawer, Popover, Tooltip, Toast

**Standards:**
- Focus trapping within overlays
- Escape key dismissal
- Scroll locking when open
- Focus restoration on close
- Enter/exit animations

### Complex Composites
Tabs, Table, Command Palette, Sidebar, Tree

**Standards:**
- Full keyboard navigation (arrows, home, end)
- Roving tabindex implementation
- Proper ARIA roles (tablist, tree, etc.)
- Recursive navigation where applicable

### Page-Level
Card, Hero, Feature Grid, Pricing Card, Testimonial, Empty State, Error State, Loading State

**Standards:**
- Compound component patterns (CardHeader/Body/Footer)
- Loading skeletons matching content shape
- Proper heading hierarchy
- Responsive behavior patterns

## Motion System

All animations respect `prefers-reduced-motion`:
- **Enter animations**: fade-in, slide-in, zoom-in
- **Exit animations**: fade-out, slide-out, zoom-out
- **Hover effects**: scale, translate, opacity transitions
- **Duration**: 150-300ms based on demographic motion profile

## Icon System

- Centralized `@skeed/asset-icon` package
- Consistent sizing (12px, 16px, 20px, 24px)
- Accessibility: `aria-hidden` where decorative, labels where functional

## Validation Checklist

- [ ] Zero TypeScript `any` types
- [ ] All props have explicit types
- [ ] Proper ref forwarding
- [ ] ARIA attributes for accessibility
- [ ] Keyboard navigation where applicable
- [ ] Loading states
- [ ] Error states
- [ ] Animated transitions
- [ ] Token-only styling (no hard-coded values)
- [ ] Demographic-appropriate contrast

## Result

95 archetype components delivering **demographically-tuned UI** with production-grade accessibility, animations, and form integration - all without writing a single line of CSS.
