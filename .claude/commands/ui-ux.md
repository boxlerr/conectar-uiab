# UI/UX Pro — Design Intelligence Checklist

Apply this checklist when building or reviewing UI components:

## 1. Accessibility (CRITICAL)
- Color contrast ≥ 4.5:1 for text, ≥ 3:1 for large text
- All interactive elements must be keyboard navigable (tabIndex, focus-visible)
- Images need alt text, icons need aria-label if meaningful
- Never rely on color alone to convey information — use icons, text, patterns
- Form inputs need visible labels (not just placeholders)

## 2. Touch & Interaction
- Minimum touch target: 44x44px on mobile
- Provide visual feedback on all interactions (hover, active, focus states)
- Destructive actions require confirmation
- Use cursor-pointer on clickable non-link elements

## 3. Performance
- Lazy-load images below the fold
- Use `next/image` for all images (auto optimization)
- Avoid layout shifts (set explicit width/height on media)
- Prefer CSS transitions over JS animations

## 4. Layout & Responsive
- Mobile-first: design for 320px, enhance upward
- Use `grid` for 2D layouts, `flex` for 1D
- Breakpoints: `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`
- Max content width: 1280px (`max-w-7xl mx-auto`)
- Consistent spacing scale: 4, 6, 8, 12, 16 (Tailwind units)

## 5. Typography & Color
- Heading hierarchy: h1 > h2 > h3 with clear visual difference
- Body text: 16px min, line-height 1.5-1.75
- Use `font-poppins` for headings, `font-sans` (Open Sans) for body
- Color palette from project tokens — don't introduce new colors

## 6. Forms & Feedback
- Inline validation with clear error messages
- Show loading state on submit buttons
- Success feedback: toast notification (sonner)
- Group related fields logically

## 7. Navigation
- Current page indicator in nav
- Breadcrumbs for deep pages
- Back links for detail pages
- Consistent CTA placement (top-right or bottom of sections)

## 8. Data Display
- Tables: sticky headers, zebra striping, sortable columns
- Lists: consistent item height, clear separators
- Numbers: format with locale (es-AR), use Intl.NumberFormat
- Dates: relative time for recent, absolute for older
- Empty states: illustration + helpful text + CTA
