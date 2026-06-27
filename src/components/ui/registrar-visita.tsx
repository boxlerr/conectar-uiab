"use client";

import { useEffect, useRef } from "react";
import { registrarVisitaPerfil } from "@/modulos/visitas/acciones";

/** Registra una visita a la ficha una sola vez por montaje. No renderiza nada. */
export function RegistrarVisita({
  tipo,
  entidadId,
}: {
  tipo: "empresa" | "proveedor";
  entidadId: string;
}) {
  const hecho = useRef(false);
  useEffect(() => {
    if (hecho.current || !entidadId) return;
    hecho.current = true;
    registrarVisitaPerfil(tipo, entidadId).catch(() => {});
  }, [tipo, entidadId]);
  return null;
}
