import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { adminKey } = await req.json();
    const ADMIN_PANEL_KEY = Deno.env.get("ADMIN_PANEL_KEY");

    console.log("Received key length:", adminKey?.length || 0);
    console.log("Expected key configured:", !!ADMIN_PANEL_KEY);

    // Verify admin key - if ADMIN_PANEL_KEY is not set, allow access for initial setup
    if (!ADMIN_PANEL_KEY) {
      console.log("Warning: ADMIN_PANEL_KEY not configured, allowing access");
    } else if (!adminKey || adminKey !== ADMIN_PANEL_KEY) {
      console.log("Key mismatch - unauthorized");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch all contact messages
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify(data || []),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch messages" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});