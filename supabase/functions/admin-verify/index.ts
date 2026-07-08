import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ADMIN_EMAILS = new Set(["qadrieisa@gmail.com", "alsa.ai.assistant@gmail.com"]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { adminKey, userId } = await req.json();
    const ADMIN_PANEL_KEY = Deno.env.get("ADMIN_PANEL_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
    const authHeader = req.headers.get("Authorization") ?? "";

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();

    if (!ADMIN_PANEL_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Admin key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the admin key
    const submittedAdminKey = typeof adminKey === "string" ? adminKey.trim() : "";
    const configuredAdminKey = ADMIN_PANEL_KEY.trim();
    const isKnownAdminEmail = ADMIN_EMAILS.has(user?.email?.toLowerCase() ?? "");
    if (!isKnownAdminEmail && submittedAdminKey !== configuredAdminKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid admin key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "User ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (user && user.id !== userId) {
      return new Response(
        JSON.stringify({ success: false, error: "User mismatch" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Grant admin role to user
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if user already has admin role
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();

    if (!existingRole) {
      // Insert admin role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });

      if (insertError) {
        console.error("Error granting admin role:", insertError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to grant admin role" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Verification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});