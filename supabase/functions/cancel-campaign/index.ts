import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get JWT from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user JWT to verify ownership
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error("User auth error:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { campaign_id } = await req.json();

    if (!campaign_id) {
      return new Response(
        JSON.stringify({ error: "campaign_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User ${user.id} requesting to cancel campaign ${campaign_id}`);

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch campaign and verify ownership
    const { data: campaign, error: campaignError } = await supabase
      .from("marketing_campaigns")
      .select("id, company_id, status")
      .eq("id", campaign_id)
      .single();

    if (campaignError || !campaign) {
      console.error("Campaign not found:", campaignError?.message);
      return new Response(
        JSON.stringify({ error: "Campanha não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user owns the company
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("id", campaign.company_id)
      .eq("owner_user_id", user.id)
      .single();

    if (companyError || !company) {
      console.error("User doesn't own this campaign's company");
      return new Response(
        JSON.stringify({ error: "Não autorizado a cancelar esta campanha" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if campaign can be canceled
    if (campaign.status !== "processing" && campaign.status !== "pending") {
      console.log(`Campaign ${campaign_id} is already ${campaign.status}, cannot cancel`);
      return new Response(
        JSON.stringify({ error: `Campanha já está ${campaign.status}, não pode ser cancelada` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update campaign status to canceled
    const { error: updateError } = await supabase
      .from("marketing_campaigns")
      .update({
        status: "canceled",
        completed_at: new Date().toISOString(),
      })
      .eq("id", campaign_id);

    if (updateError) {
      console.error("Error updating campaign:", updateError.message);
      return new Response(
        JSON.stringify({ error: "Falha ao cancelar campanha" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update pending message logs to skipped
    const { error: logsError } = await supabase
      .from("campaign_message_logs")
      .update({
        status: "skipped",
        error_message: "Campanha cancelada pelo usuário",
      })
      .eq("campaign_id", campaign_id)
      .eq("status", "pending");

    if (logsError) {
      console.error("Error updating message logs:", logsError.message);
      // Don't fail the whole operation, campaign is already canceled
    }

    console.log(`Campaign ${campaign_id} successfully canceled`);

    return new Response(
      JSON.stringify({ success: true, message: "Campanha cancelada com sucesso" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
