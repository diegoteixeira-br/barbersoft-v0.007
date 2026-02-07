import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { barberId, userId, inviteToken } = await req.json();

    if (!barberId || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: barberId, userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Linking barber ${barberId} to user ${userId}`);

    // Verify invite token if provided
    if (inviteToken) {
      const { data: barber, error: verifyError } = await supabaseAdmin
        .from("barbers")
        .select("id, invite_token")
        .eq("id", barberId)
        .eq("invite_token", inviteToken)
        .single();

      if (verifyError || !barber) {
        console.error("Invalid invite token:", verifyError);
        return new Response(
          JSON.stringify({ error: "Token de convite inválido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Update barber with user_id and clear invite_token
    const { error: updateError } = await supabaseAdmin
      .from("barbers")
      .update({ 
        user_id: userId,
        invite_token: null // Clear the token after use
      })
      .eq("id", barberId);

    if (updateError) {
      console.error("Error updating barber:", updateError);
      throw updateError;
    }

    // Add barber role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: userId, role: "barber" },
        { onConflict: "user_id,role" }
      );

    if (roleError) {
      console.error("Error adding role:", roleError);
      // Don't throw, barber is already linked
    }

    console.log(`Successfully linked user ${userId} to barber ${barberId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in link-barber-account:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
