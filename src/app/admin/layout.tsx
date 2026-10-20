import { ConUsuarioDelServidor } from "@/modulos/autenticacion/usuario-del-servidor";
import { LayoutAdmin } from "./layout-admin";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConUsuarioDelServidor>
      <LayoutAdmin>{children}</LayoutAdmin>
    </ConUsuarioDelServidor>
  );
}
