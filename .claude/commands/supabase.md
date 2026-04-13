# Supabase & PostgreSQL Best Practices

## Query Performance (CRITICAL)
- Always add indexes for columns in WHERE, JOIN, ORDER BY clauses
- Use `select('col1, col2')` not `select('*')` — fetch only needed columns
- Use `.single()` when expecting one row — avoids array wrapping
- For counts: `select('*', { count: 'exact', head: true })` — no data transfer
- Use `Promise.all()` for independent parallel queries in Server Components

## Connection Management
- Use `@supabase/ssr` with `createServerClient` for server-side (cookies-based)
- Use `createBrowserClient` for client-side
- Never expose service_role key in client code — only PUBLISHABLE_KEY
- Server client: create per-request (cookies are request-scoped)

## Row Level Security (RLS)
- ALWAYS enable RLS on every table
- Use `auth.uid()` in policies, never trust client-provided user IDs
- Test policies: `SET ROLE authenticated; SET request.jwt.claims = '...'`
- Common pattern: `USING (auth.uid() = user_id)` for row ownership

## Schema Design
- Use `uuid` for primary keys (gen_random_uuid() default)
- Use `timestamptz` not `timestamp` — always timezone-aware
- Add `creado_en` (DEFAULT now()) and `actualizado_en` to all tables
- Use CHECK constraints for enum-like fields (estado, tipo, etc.)
- Foreign keys: always add `ON DELETE` behavior (CASCADE, SET NULL, RESTRICT)

## Status Fields (this project)
- `empresas.estado`: borrador | pendiente_revision | aprobada | rechazada | pausada | oculta
- `proveedores.estado`: borrador | pendiente_revision | aprobado | rechazado | pausado | oculto
- `resenas.estado`: pendiente_revision | aprobada | rechazada | oculta
- Gender agreement: empresas/resenas = feminine, proveedores = masculine

## Migrations
- One concern per migration file
- Always use `IF NOT EXISTS` for CREATE TABLE/INDEX
- Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for safety
- Seed data: use `ON CONFLICT ... DO UPDATE` for idempotent inserts
- Name constraints explicitly for easier debugging

## Real-time & Edge Functions
- Use Realtime channels for live updates (presence, broadcast, postgres_changes)
- Edge Functions for webhooks, third-party integrations
- Prefer database functions (PL/pgSQL) for complex business logic
