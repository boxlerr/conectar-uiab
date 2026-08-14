import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/servidor";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/suscripcion/cancelar
 *
 * Da de baja la suscripción del socio al final del período que ya pagó — no en
 * el acto: cobrarle el año y sacarlo en agosto sería quedarse con la plata.
 * `finaliza_en` toma el próximo vencimiento, así el gate lo sigue dejando entrar
 * hasta esa fecha.
 *
 * Reemplaza a /api/mercadopago/cancelar. Sin pasarela no hay ningún preapproval
 * que dar de baja: alcanza con dejar de cobrarle, que es una decisión humana.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const admin = createAdminClient();

  const { data: perfil } = await admin
    .from("perfiles")
    .select("rol_sistema")
    .eq("id", user.id)
    .maybeSingle();

  const rol = perfil?.rol_sistema;
  if (rol !== "company" && rol !== "provider") {
    return NextResponse.json({ error: "Esta cuenta no tiene una suscripción." }, { status: 400 });
  }

  const tabla = rol === "company" ? "miembros_empresa" : "miembros_proveedor";
  const columna = rol === "company" ? "empresa_id" : "proveedor_id";

  const { data: miembro } = await admin
    .from(tabla)
    .select(columna)
    .eq("perfil_id", user.id)
    .limit(1)
    .maybeSingle();

  const entidadId = (miembro as Record<string, string> | null)?.[columna];
  if (!entidadId) {
    return NextResponse.json({ error: "Tu cuenta no está vinculada a ninguna ficha." }, { status: 400 });
  }

  const { data: sus } = await admin
    .from("suscripciones")
    .select("id, estado, metodo_pago, monto, proximo_cobro_en")
    .eq(columna, entidadId)
    .order("creado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sus) return NextResponse.json({ error: "No encontramos una suscripción activa." }, { status: 404 });
  if (sus.estado === "cancelada") return NextResponse.json({ ok: true, yaEstaba: true });

  // La de cortesía no se cancela desde acá: si una socia UIAB apretara el botón
  // se quedaría sin el acceso que le corresponde por ser socia, y sin forma de
  // recuperarlo sola.
  if (sus.metodo_pago === "cortesia" || Number(sus.monto) === 0) {
    return NextResponse.json(
      { error: "Tu acceso es de cortesía por ser socia de la UIAB: no hay ninguna suscripción que cancelar." },
      { status: 400 }
    );
  }

  const { error } = await admin
    .from("suscripciones")
    .update({
      estado: "cancelada",
      cancelada_en: new Date().toISOString(),
      // Sigue entrando hasta que se termine lo que pagó.
      finaliza_en: sus.proximo_cobro_en ?? new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", sus.id);

  if (error) {
    console.error("[suscripcion/cancelar]", error.message);
    return NextResponse.json({ error: "No pudimos cancelar la suscripción. Probá de nuevo." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, finalizaEn: sus.proximo_cobro_en });
}
