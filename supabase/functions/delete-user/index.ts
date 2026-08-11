import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400, headers: corsHeaders,
      });
    }

    const { error: dbError } = await supabaseAdmin.from("users").delete().eq("id", userId);
    if (dbError) {
      return new Response(JSON.stringify({ error: dbError.message }), {
        status: 500, headers: corsHeaders,
      });
    }

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 500, headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: corsHeaders,
    });
  } catch (err) {
    console.error("Unexpected error deleting user:", err);
    return new Response(JSON.stringify({ error: "Unexpected server error" }), {
      status: 500, headers: corsHeaders,
    });
  }
});