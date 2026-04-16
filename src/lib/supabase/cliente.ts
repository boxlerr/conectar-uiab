import { createBrowserClient } from '@supabase/ssr'

type BrowserClient = ReturnType<typeof createBrowserClient>

// Singleton: una sola instancia del cliente por tab. Evita que cada render
// devuelva una referencia nueva, lo que disparaba bucles en useEffect con
// `supabase` en las dependencias (re-suscripciones a onAuthStateChange y
// re-fetches infinitos que dejaban las páginas atascadas en loading al
// navegar entre secciones).
let client: BrowserClient | undefined

export function createClient(): BrowserClient {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    )
  }
  return client
}
