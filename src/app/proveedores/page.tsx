import { redirect } from "next/navigation";

// Proveedores page was merged into /empresas?categoria=proveedores.
// The unified directorio surfaces empresas socias + particulares together.
export default function ProveedoresRedirect() {
  redirect("/empresas?categoria=proveedores");
}
