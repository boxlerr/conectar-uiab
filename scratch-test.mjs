import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const safeData = {
    razon_social: "Vaxler",
    nombre_comercial: "Vaxler Software",
    email: "contacto@vaxler.com.ar",
    telefono: null,
    whatsapp: "3442419341",
    sitio_web: "https://vaxler.com.ar/",
    pais: "Argentina",
    provincia: "Buenos Aires",
    localidad: null,
    direccion: null,
    descripcion: null,
    cuit: "20445551881",
    ruta_logo: null
  };

  console.log("Attempting insert...");
  const { data, error } = await supabaseAdmin
    .from("empresas")
    .insert(safeData)
    .select()
    .single();

  if (error) {
    console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2));
  } else {
    console.log("SUCCESS:", data);
  }
}

test();
