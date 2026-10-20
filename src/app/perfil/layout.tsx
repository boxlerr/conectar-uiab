import { ConUsuarioDelServidor } from "@/modulos/autenticacion/usuario-del-servidor";
import { LayoutPerfil } from "./layout-perfil";

export default function PerfilLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConUsuarioDelServidor>
      <LayoutPerfil>{children}</LayoutPerfil>
    </ConUsuarioDelServidor>
  );
}
