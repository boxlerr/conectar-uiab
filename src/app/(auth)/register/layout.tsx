import type { ReactNode } from "react";
import { ConPreciosVigentes } from "@/modulos/suscripciones/con-precios-vigentes";

// La página es "use client": el precio del panel le llega por contexto.
export default function Layout({ children }: { children: ReactNode }) {
  return <ConPreciosVigentes>{children}</ConPreciosVigentes>;
}
