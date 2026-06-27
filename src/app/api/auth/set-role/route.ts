import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/servidor';

export async function POST(request: Request) {
  try {
    // ── Autorización: SOLO un administrador autenticado puede cambiar roles. ──
    // Sin esta verificación, cualquiera podía promover a cualquier usuario a
    // 'admin' (escalada de privilegios crítica), porque el endpoint usa la
    // service_role key que saltea RLS.
    const supabaseSesion = await createServerClient();
    const { data: { user } } = await supabaseSesion.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Falta SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: perfilActor } = await supabaseAdmin
      .from('perfiles')
      .select('rol_sistema')
      .eq('id', user.id)
      .maybeSingle();
    if (perfilActor?.rol_sistema !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    // Asegurar que solo se asignen roles permitidos
    const validRoles = ['admin', 'company', 'provider'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Rol no válido' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { role: role }
    });

    if (error) {
      console.error('Error al actualizar rol:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Rol asignado correctamente', user: data.user }, { status: 200 });

  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
