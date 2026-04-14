import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Fetching Vaxler 2 ID...");
  const { data: empData, error: empErr } = await supabaseAdmin
    .from("empresas")
    .select("id")
    .eq("cuit", "20445551882")
    .single();
    
  if (empErr) {
    console.error("No se encontró la empresa:", empErr);
    return;
  }
  const empresa_id = empData.id;
  console.log("Empresa ID:", empresa_id);

  console.log("Fetching PRUEBA2 ID...");
  const { data: perfData, error: perfErr } = await supabaseAdmin
    .from("perfiles")
    .select("id")
    .eq("email", "bonnalucagustin@gmail.com")
    .single();
    
  if (perfErr) {
    console.error("No se encontró el perfil:", perfErr);
    return;
  }
  const perfil_id = perfData.id;
  console.log("Perfil ID:", perfil_id);

  console.log("Inserting into miembros_empresa...");
  const { data: insertData, error: insertError } = await supabaseAdmin
    .from("miembros_empresa")
    .insert({
      empresa_id,
      perfil_id,
      rol: 'admin',
      es_principal: true
    })
    .select();
    
  if (insertError) {
    console.error("Error al insertar miembro:", insertError);
  } else {
    console.log("¡RELACIÓN CREADA CON ÉXITO!", insertData);
  }
}

run();
