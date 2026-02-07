import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-timestamp",
};

// Secret for validating requests from n8n - loaded from environment variable
const CALLBACK_SECRET = Deno.env.get("N8N_CALLBACK_SECRET");

// Maximum allowed timestamp drift (5 minutes)
const MAX_TIMESTAMP_DRIFT_MS = 5 * 60 * 1000;

// Generic error messages - never expose internal details
const GENERIC_ERRORS = {
  unauthorized: "Unauthorized",
  badRequest: "Invalid request",
  notFound: "Not found",
  internal: "Internal server error",
};

// HMAC-SHA256 signature verification
async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return signature === expectedSignature;
  } catch (e) {
    console.error("Signature verification error:", e);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get parameters from URL or body
    let campaign_id: string | null = null;
    let secret: string | null = null;
    let rawBody = "";

    // Try to get from URL query params first (for GET requests from n8n)
    const url = new URL(req.url);
    campaign_id = url.searchParams.get("campaign_id");
    secret = url.searchParams.get("secret");

    // If not in URL, try body (for POST requests)
    if (!campaign_id && req.method === "POST") {
      rawBody = await req.text();
      try {
        const body = JSON.parse(rawBody);
        campaign_id = body.campaign_id;
        secret = body.secret;
      } catch {
        console.error("Invalid JSON in request body");
        return new Response(
          JSON.stringify({ error: GENERIC_ERRORS.badRequest }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log(`Check campaign status request for: ${campaign_id}`);

    // === AUTHENTICATION ===
    if (!CALLBACK_SECRET) {
      console.error("N8N_CALLBACK_SECRET not configured");
      return new Response(
        JSON.stringify({ error: GENERIC_ERRORS.internal }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let isAuthenticated = false;

    // Method 1: HMAC signature verification (preferred)
    const signatureHeader = req.headers.get("x-signature");
    const timestampHeader = req.headers.get("x-timestamp");
    
    if (signatureHeader && timestampHeader) {
      const requestTimestamp = parseInt(timestampHeader, 10);
      const now = Date.now();
      
      // Check timestamp drift to prevent replay attacks
      if (Math.abs(now - requestTimestamp) > MAX_TIMESTAMP_DRIFT_MS) {
        console.error("Request timestamp too old or in future");
        return new Response(
          JSON.stringify({ error: GENERIC_ERRORS.unauthorized }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify HMAC signature - for GET use query string, for POST use body
      const payloadToSign = req.method === "POST" 
        ? `${timestampHeader}.${rawBody}`
        : `${timestampHeader}.${url.search}`;
      isAuthenticated = await verifySignature(payloadToSign, signatureHeader, CALLBACK_SECRET);
      
      if (!isAuthenticated) {
        console.error("Invalid HMAC signature");
      }
    }
    
    // Method 2: Legacy secret (for backward compatibility)
    if (!isAuthenticated && secret) {
      isAuthenticated = secret === CALLBACK_SECRET;
      if (!isAuthenticated) {
        console.error("Invalid legacy secret");
      }
    }

    if (!isAuthenticated) {
      console.error("Authentication failed");
      return new Response(
        JSON.stringify({ error: GENERIC_ERRORS.unauthorized }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!campaign_id) {
      return new Response(
        JSON.stringify({ error: GENERIC_ERRORS.badRequest }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch campaign status
    const { data: campaign, error: campaignError } = await supabase
      .from("marketing_campaigns")
      .select("status")
      .eq("id", campaign_id)
      .single();

    if (campaignError || !campaign) {
      console.error("Campaign not found:", campaignError?.message);
      return new Response(
        JSON.stringify({ error: GENERIC_ERRORS.notFound, status: "not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Campaign ${campaign_id} status: ${campaign.status}`);

    // Return status - n8n will use this to decide whether to continue
    return new Response(
      JSON.stringify({ 
        status: campaign.status,
        should_continue: campaign.status === "processing",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: GENERIC_ERRORS.internal }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
