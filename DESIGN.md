Act as a Senior Frontend Engineer and Expert UI Designer.

Generate the final code immediately following these definitions:

## Style

- **Name:** Comparative Analysis Dashboard
- **Type:** BI/Analytics
- **Keywords:** Side-by-side comparisons, period-over-period metrics, A/B test results, regional comparisons, performance benchmarks
- **Era:** 2020s Modern
- **Light/Dark:** ✓ Full / ✓ Full

## Color Palette

- **Primary:** Comparison colors: primary (blue), comparison (orange/purple), delta indicator (green/red)
- **Secondary:** Winning metric color (green), losing metric color (red), neutral comparison (grey), benchmark colors

## Visual Effects

Comparison bar animations (grow to value), delta indicator animations (direction arrows), highlight on compare

## AI Visual Direction

Design a comparison dashboard. Use: side-by-side metrics, period selectors (vs last month), delta indicators (+/-), benchmark lines, A/B comparison tables, winning/losing highlights, percentage change badges.

## CSS Technical

```css
display: flex for side-by-side, gap for comparison spacing, color coding (green up, red down), arrow indicators, diff highlighting, comparison table zebra striping
```

## Design System Variables

```css
--positive-color: #22C55E, --negative-color: #EF4444, --neutral-color: #6B7280, --comparison-gap: 2rem, --arrow-size: 16px, --badge-padding: 4px 8px
```

## Implementation Checklist

- ☐ Period selector works, ☐ Deltas calculated, ☐ Colors meaningful, ☐ Benchmarks shown, ☐ Mobile stacks properly, ☐ Export comparison

## Execution Rules

1. Strictly follow the defined visual style.
2. Use high-quality inline SVG icons (Heroicons or Lucide style) — NEVER use emojis as icons.
3. Add `cursor-pointer` and smooth `hover` states (transition-all) on all interactive elements.
4. Required Page Structure:
   - Navbar (Logo + Links + CTA)
   - Hero Section (Impactful Headline + Subtitle + 2 buttons + 3D/Abstract visual element via CSS)
   - Features (3 cards with icons)
   - Testimonials (3 cards)
   - Pricing (3 tiers, highlight the middle one)
   - Final CTA
   - Full Footer with social links, privacy policy, terms of use, contact and SEO links.
5. All text content must be in English.
6. The visual must be CLEARLY distinct — do not create a "default Bootstrap" design. Force the use of the provided design system variables.
7. Use `<style>` tags in the head for custom classes (especially for complex backdrop-filter effects and animations) that Tailwind CDN doesn't cover.
8. Full Responsiveness: Layout must adapt perfectly to Mobile, Tablet and Desktop (vertical stack on mobile).
9. Include basic SEO, Viewport and Open Graph meta tags in `<head>`.
10. Footer must contain: Copyright 2026, Secondary navigation links and Social media icons.
11. Make the creative decisions needed to deliver the complete, functional result now.
