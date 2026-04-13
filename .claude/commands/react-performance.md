# React & Next.js Performance Optimization

## Eliminating Waterfalls (CRITICAL)
- Fetch data in Server Components, not in useEffect
- Use `Promise.all()` for parallel fetches — never sequential awaits for independent data
- Colocate data fetching with the component that needs it
- Use `<Suspense>` to stream slow sections without blocking the page

## Bundle Size (HIGH)
- Import specific modules: `import { Button } from '@/components/ui/button'` not `import * as UI`
- Use `next/dynamic` for heavy client components not needed on initial render
- Audit with `npx @next/bundle-analyzer` — look for >50KB chunks
- Prefer CSS (Tailwind) over JS for animations when possible
- Tree-shake: use named exports, avoid barrel files with side effects

## Server-Side Performance (HIGH)
- Default to Server Components — zero client JS
- Push `'use client'` boundary as low as possible in the tree
- Cache expensive computations with `unstable_cache` or React `cache()`
- Use `loading.tsx` for instant perceived performance

## Re-render Optimization (MEDIUM)
- Lift state up only as far as needed — don't put everything in context
- Use `React.memo()` for expensive pure components receiving stable props
- Use `useCallback` for event handlers passed to memoized children
- Split contexts: separate frequently-changing values from stable ones

## Client-Side Data
- SWR or React Query for client-side fetching with caching
- Optimistic updates for better perceived performance
- Prefetch on hover/focus for likely navigations (`<Link prefetch>`)

## Rendering Performance
- Use CSS `content-visibility: auto` for long lists
- Virtualize long lists (>100 items) with react-window or tanstack-virtual
- Avoid layout thrashing: batch DOM reads before writes
- Use `will-change` sparingly and only on elements about to animate

## JavaScript Performance
- Debounce search inputs (300ms)
- Use `requestAnimationFrame` for scroll/resize handlers
- Prefer `Map`/`Set` over arrays for frequent lookups
- Avoid creating objects/arrays in render — move to module scope or useMemo
