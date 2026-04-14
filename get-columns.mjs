import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabaseAdmin.rpc('get_schema_columns', { table_name: 'oportunidades' });
  if (error) {
    // If RPC doesn't exist, just select one row and look at the keys
    const { data: row } = await supabaseAdmin.from('oportunidades').select('*').limit(1);
    console.log(row ? Object.keys(row[0]) : "No data");
  } else {
    console.log(data);
  }
}
run();
