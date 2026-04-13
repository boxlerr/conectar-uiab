# Next.js Best Practices (v15+)

## File Conventions
- `layout.tsx` — shared UI, persists across navigations. NEVER re-render on route change
- `page.tsx` — unique route UI, must be default export
- `loading.tsx` — instant loading UI via Suspense boundary
- `error.tsx` — error boundary, must be `'use client'`
- `not-found.tsx` — 404 UI for `notFound()` calls
- `route.ts` — API endpoint (cannot coexist with page.tsx in same segment)

## Server vs Client Components
- Default to Server Components (no directive needed)
- Add `'use client'` ONLY when using: useState, useEffect, event handlers, browser APIs
- NEVER make a component `'use client'` just because a child needs it — push client boundary down
- NEVER pass non-serializable props (functions, classes) from Server to Client

## Async Patterns (v15+)
- `params` and `searchParams` are now **Promises** — must await them:
  ```tsx
  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  }
  ```
- `cookies()` and `headers()` are async — await them
- Dynamic APIs (`cookies`, `headers`, `searchParams`) opt route into dynamic rendering

## Data Fetching
- **Server Components**: fetch data directly, no useEffect needed
- **Server Actions**: `'use server'` functions for mutations (forms, button clicks)
- **Route Handlers**: only for webhooks, external API endpoints, non-React consumers
- Use `Promise.all()` for parallel independent fetches in Server Components

## Error Handling
- Each route segment can have its own `error.tsx` boundary
- Use `redirect()` for auth/navigation (throws, never returns)
- Use `notFound()` for missing resources (throws to nearest not-found.tsx)

## Performance
- Use `<Suspense>` boundaries to stream slow sections
- Use `loading.tsx` for instant loading states per route segment
- Dynamic imports (`next/dynamic`) for heavy client components
- Use `next/image` for all images — auto WebP, lazy loading, srcset
- Use `next/font` for font optimization — no layout shift

## Metadata
- Export `metadata` object or `generateMetadata()` function from page/layout
- Always include: title, description, openGraph, twitter cards
- Use `template` in layout metadata for consistent title patterns
