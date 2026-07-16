import { validarTokenCore } from "@/modulos/altas/invitaciones-core";
import { FormDefinirPassword } from "./FormDefinirPassword";

export const metadata = {
  title: "Definí tu contraseña — UIAB Conecta",
  robots: { index: false, follow: false },
};

// Validamos el token en el servidor (sin consumirlo) y pasamos el resultado ya
// resuelto al formulario cliente. Así no hay round-trip ni estado "verificando".
export default async function DefinirPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const val = token
    ? await validarTokenCore(token)
    : ({ ok: false, motivo: "invalido" } as const);

  const estadoInicial = val.ok ? "ok" : val.motivo;
  const email = val.ok ? val.email : null;

  return (
    <FormDefinirPassword
      token={token ?? ""}
      estadoInicial={estadoInicial}
      email={email}
    />
  );
}
