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
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ valid: false, error: "No token provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if token exists and is active
    const { data: bridgeToken, error } = await supabase
      .from("bridge_tokens")
      .select("*, profiles!inner(subscription_tier, subscription_expires_at)")
      .eq("token", token)
      .eq("is_active", true)
      .single();

    if (error || !bridgeToken) {
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid or expired token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check token expiry
    if (bridgeToken.expires_at && new Date(bridgeToken.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, error: "Token expired" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check subscription status
    const profile = bridgeToken.profiles;
    const tier = profile?.subscription_tier;
    const expiresAt = profile?.subscription_expires_at;

    // Free users cannot use PC Bridge
    if (!tier || tier === "free") {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "PC Bridge requires a Pro or Elite subscription. Please upgrade to continue.",
          subscription_required: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if subscription is expired
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Your subscription has expired. Please renew to use PC Bridge.",
          subscription_expired: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check tier matches token tier
    const tokenTier = bridgeToken.tier;
    const allowedTiers: Record<string, string[]> = {
      "freetier": [], // Free tier not allowed
      "pro": ["pro", "elite"],
      "elite": ["elite"]
    };

    // For pro bridge, pro and elite users can use it
    // For elite bridge, only elite users can use it
    if (tokenTier === "elite" && tier !== "elite") {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "This bridge requires an Elite subscription.",
          tier_mismatch: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        valid: true, 
        tier: tier,
        token_tier: tokenTier,
        expires_at: expiresAt
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ valid: false, error: "Verification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});