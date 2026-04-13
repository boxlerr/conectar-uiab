# Frontend Design — Production-Grade UI

Apply these principles when creating or reviewing frontend interfaces:

## Core Philosophy
- Every UI must have a **bold, distinctive aesthetic direction** — never generic "AI-generated" look
- Avoid: default rounded corners everywhere, generic gradients, cookie-cutter card layouts
- Embrace: strong typography hierarchy, intentional whitespace, editorial composition

## Typography
- Establish extreme hierarchy: display (4xl+) for heroes, clear heading levels, readable body (16px min)
- Use font-weight contrast (800 for headings, 400 for body) — not just size
- Limit to 2 font families max. Use the project's configured fonts (Poppins headings, Open Sans body)

## Color & Theme
- Use the project's design tokens (`primary-*`, `accent-*` from globals.css)
- Avoid pure black text — use `slate-900` or `[#0f172a]`
- Use color purposefully: emerald=success, amber=warning, red=destructive, primary=interactive

## Layout
- Use asymmetric layouts for visual interest, not just 3-column grids
- Cards need visual weight variation — mix sizes in bento/masonry grids
- Whitespace is a design element, not wasted space. Use `space-y-8` minimum between sections

## Motion & Interactions
- Subtle hover states on all interactive elements (`transition-all duration-200`)
- Use `group-hover` for parent-child hover effects
- Reserve animations for meaningful state changes, not decoration

## Component Quality Checklist
- [ ] Responsive: works on mobile (320px) through desktop (1440px)
- [ ] Accessible: proper contrast ratios, focus states, semantic HTML
- [ ] Loading states: skeleton/placeholder for async content
- [ ] Empty states: helpful messaging, not just "No data"
- [ ] Error states: graceful fallbacks with recovery actions
