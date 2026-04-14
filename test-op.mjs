import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Fetching Oportunidad 00000000-0000-0000-0000-000000000003 ...");
  const { data, error } = await supabaseAdmin
    .from('oportunidades')
    .select(`*, categoria:categorias(nombre), empresa:empresas(razon_social)`)
    .eq('id', "00000000-0000-0000-0000-000000000003")
    .single();

  if (error) {
    console.error("ERROR:", error);
  } else {
    console.log("DATA:", data);
  }
}
run();
