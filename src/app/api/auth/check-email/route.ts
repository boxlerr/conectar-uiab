import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Lightweight endpoint to check if an email is already registered.
 * Used during the registration flow (step 6) to warn the user early,
 * rather than letting Supabase Auth reject the signUp at the very end.
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ exists: false })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if the email already exists in perfiles (our user table)
    const { data } = await supabaseAdmin
      .from('perfiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    return NextResponse.json({ exists: !!data })
  } catch {
    // On any error, don't block the registration flow
    return NextResponse.json({ exists: false })
  }
}
