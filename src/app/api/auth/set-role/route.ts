import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    // Asegurar que solo se asignen roles permitidos
    const validRoles = ['admin', 'company', 'provider'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Rol no válido' }, { status: 400 });
    }

    // Para invocar .auth.admin, necesitamos la clave service_role 
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Falta SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { role: role }
    });

    if (error) {
      console.error('Error al actualizar rol:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Rol asignado correctamente', user: data.user }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
