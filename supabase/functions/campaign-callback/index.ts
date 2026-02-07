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
  internal: "Internal server error",
};

interface CallbackBody {
  log_id: string;
  campaign_id: string;
  status: "sent" | "failed";
  error_message?: string;
  secret?: string; // Legacy support
  timestamp?: number; // For replay protection
}

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

    const rawBody = await req.text();
    let body: CallbackBody;
    try {
      body = JSON.parse(rawBody);
    } catch {
      console.error("Invalid JSON in request body");
      return new Response(
        JSON.stringify({ error: GENERIC_ERRORS.badRequest }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { log_id, campaign_id, status, error_message, secret, timestamp } = body;

    console.log(`Callback received for log ${log_id}, status: ${status}`);

    // === AUTHENTICATION ===
    // Support both legacy (secret in body) and new (HMAC signature) methods
    const signatureHeader = req.headers.get("x-signature");
    const timestampHeader = req.headers.get("x-timestamp");

    if (!CALLBACK_SECRET) {
      console.error("N8N_CALLBACK_SECRET not configured");
      return new Response(
        JSON.stringify({ error: GENERIC_ERRORS.internal }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let isAuthenticated = false;

    // Method 1: HMAC signature verification (preferred)
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

      // Verify HMAC signature
      const payloadToSign = `${timestampHeader}.${rawBody}`;
      isAuthenticated = await verifySignature(payloadToSign, signatureHeader, CALLBACK_SECRET);
      
      if (!isAuthenticated) {
        console.error("Invalid HMAC signature");
      }
    }
    
    // Method 2: Legacy secret in body (for backward compatibility)
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

    // === INPUT VALIDATION ===
    if (!log_id || !campaign_id || !status) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: GENERIC_ERRORS.badRequest }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate status enum
    if (status !== "sent" && status !== "failed") {
      console.error("Invalid status value");
      return new Response(
        JSON.stringify({ error: GENERIC_ERRORS.badRequest }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update individual message log
    const { error: logError } = await supabase
      .from("campaign_message_logs")
      .update({
        status,
        error_message: error_message || null,
        sent_at: new Date().toISOString(),
      })
      .eq("id", log_id);

    if (logError) {
      console.error("Error updating log:", logError.message);
      return new Response(
        JSON.stringify({ error: GENERIC_ERRORS.internal }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update campaign counters using RPC
    if (status === "sent") {
      const { error: rpcError } = await supabase.rpc("increment_campaign_sent", { cid: campaign_id });
      if (rpcError) {
        console.error("Error incrementing sent count:", rpcError.message);
      }
    } else {
      const { error: rpcError } = await supabase.rpc("increment_campaign_failed", { cid: campaign_id });
      if (rpcError) {
        console.error("Error incrementing failed count:", rpcError.message);
      }
    }

    console.log(`Log ${log_id} updated to ${status}`);

    return new Response(
      JSON.stringify({ success: true }),
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
