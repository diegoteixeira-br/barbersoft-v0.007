import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOTAL_SPOTS = 30;

// Define thresholds for remaining spots display
// This prevents exposing exact company count while still showing scarcity
function getRemainingDisplay(actualRemaining: number): { remaining: number; message: string } {
  if (actualRemaining <= 0) {
    return { remaining: 0, message: "Vagas esgotadas" };
  } else if (actualRemaining <= 5) {
    return { remaining: actualRemaining, message: "Últimas vagas!" };
  } else if (actualRemaining <= 10) {
    return { remaining: 10, message: "Menos de 10 vagas" };
  } else if (actualRemaining <= 15) {
    return { remaining: 15, message: "Menos de 15 vagas" };
  } else {
    return { remaining: 20, message: "Vagas disponíveis" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Count the number of companies (each signup creates one)
    const { count, error } = await supabase
      .from("companies")
      .select("*", { count: "exact", head: true });

    if (error) {
      throw error;
    }

    const usedSpots = count || 0;
    const actualRemaining = Math.max(0, TOTAL_SPOTS - usedSpots);
    
    // Return obfuscated remaining spots to prevent competitive intelligence
    const displayInfo = getRemainingDisplay(actualRemaining);

    return new Response(
      JSON.stringify({
        remaining: displayInfo.remaining,
        message: displayInfo.message,
        hasSpots: actualRemaining > 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        remaining: 20, 
        message: "Vagas disponíveis",
        hasSpots: true,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
