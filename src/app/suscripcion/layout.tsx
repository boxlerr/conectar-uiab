import { ConUsuarioDelServidor } from "@/modulos/autenticacion/usuario-del-servidor";

/** Privada y dinámica: renderiza con el usuario ya resuelto en el servidor. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ConUsuarioDelServidor>{children}</ConUsuarioDelServidor>;
}
