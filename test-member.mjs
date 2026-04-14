import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log("Fetching Vaxler 2 ID...");
  const { data: empData } = await supabaseAdmin.from("empresas").select("id").eq("cuit", "20445551882").single();
  console.log("Company ID:", empData?.id);

  console.log("Fetching PRUEBA2 ID...");
  const { data: perfData } = await supabaseAdmin.from("perfiles").select("id").eq("email", "bonnalucagustin@gmail.com").single();
  console.log("Profile ID:", perfData?.id);

  if (empData && perfData) {
    console.log("Attempting insert into miembros_empresa...");
    const { data: insertData, error: insertError } = await supabaseAdmin.from("miembros_empresa").insert({
      empresa_id: empData.id,
      perfil_id: perfData.id,
      rol: 'admin',
      es_principal: true
    });
    
    if (insertError) {
      console.error("MEMBER ERROR:", insertError);
    } else {
      console.log("MEMBER SUCCESS");
    }
  }
}
test();
