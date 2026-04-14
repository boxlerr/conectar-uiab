import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const empresa_id = "4270a12f-5955-40a3-be60-c660314e0c97";
  const perfil_id = "ef54930e-e16e-4447-b03b-1f3cee32fa6d";
  
  const roles = ["administrador", "propietario", "dueño", "owner", "socio", "gestor"];
  
  for (const rol of roles) {
    console.log("Testing:", rol);
    const { error } = await supabaseAdmin.from("miembros_empresa").insert({ empresa_id, perfil_id, rol, es_principal: true });
    if (!error) {
      console.log("SUCCESS WITH ROLE:", rol);
      return;
    }
    console.log(error.message);
  }
}
run();
