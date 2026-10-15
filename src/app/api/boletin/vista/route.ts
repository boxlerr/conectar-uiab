import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/servidor";
import { registrarVistaDeNota } from "@/modulos/boletin/vistas";
import {
  diaDeVista,
  esUserAgentDeBot,
  esUuid,
  idVisitante,
  ipDelPedido,
} from "@/modulos/boletin/vistas-reglas";

/**
 * Anota que alguien abrió una nota del Boletín. Lo llama `RegistrarVistaNota`
 * desde el navegador, una vez por montaje.
 *
 * POR QUÉ UNA RUTA Y NO REGISTRAR EN EL RENDER: la página de la nota la piden
 * también los crawlers, los previews de WhatsApp y los prefetch del router, y
 * ninguno de esos es una persona leyendo. Desde el navegador, después de
 * hidratar, sólo cuenta quien efectivamente la abrió.
 *
 * Y una ruta y no un Server Action porque los actions se rompen con el deploy
 * skew (el id del action cambia en cada deploy y una pestaña vieja manda uno
 * que ya no existe) — ver memoria "Carga infinita: Server Actions".
 *
 * Siempre contesta 204, se haya anotado o no: al navegador no le importa, y no
 * hay por qué contarle a nadie qué se filtró.
 */
export async function POST(req: NextRequest) {
  const listo = () => new NextResponse(null, { status: 204 });

  const userAgent = req.headers.get("user-agent") ?? "";
  if (esUserAgentDeBot(userAgent)) return listo();

  const body = (await req.json().catch(() => null)) as { id?: unknown } | null;
  const id = body?.id;
  if (!esUuid(id)) return NextResponse.json({ error: "id inválido" }, { status: 400 });

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Los admins entran a revisar lo que publicaron: no son lectores.
      const { data: perfil } = await supabase
        .from("perfiles")
        .select("rol_sistema")
        .eq("id", user.id)
        .maybeSingle();
      if (perfil?.rol_sistema === "admin") return listo();
    }

    const dia = diaDeVista();
    await registrarVistaDeNota({
      comunicadoId: id,
      dia,
      visitante: idVisitante({
        perfilId: user?.id ?? null,
        dia,
        ip: ipDelPedido(req.headers),
        userAgent,
        sal: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      }),
      conSesion: Boolean(user),
    });
  } catch (e) {
    console.error("[boletin] vista:", e instanceof Error ? e.message : e);
  }

  return listo();
}
