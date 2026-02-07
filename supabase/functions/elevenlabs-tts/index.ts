import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const RATE_LIMIT_MAX_REQUESTS_ANONYMOUS = 3; // Max 3 requests per minute for anonymous
const RATE_LIMIT_MAX_REQUESTS_AUTHENTICATED = 20; // Max 20 requests per minute for authenticated

function getRateLimitKey(ip: string, isAuthenticated: boolean): string {
  return isAuthenticated ? `auth:${ip}` : `anon:${ip}`;
}

function checkRateLimit(ip: string, isAuthenticated: boolean): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const key = getRateLimitKey(ip, isAuthenticated);
  const maxRequests = isAuthenticated ? RATE_LIMIT_MAX_REQUESTS_AUTHENTICATED : RATE_LIMIT_MAX_REQUESTS_ANONYMOUS;
  
  const entry = rateLimitMap.get(key);
  
  if (!entry || now > entry.resetAt) {
    // Create new entry or reset expired one
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

// Clean up old entries periodically (prevent memory leak)
function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    // Check authentication - but don't require it
    const authHeader = req.headers.get("Authorization");
    let isAuthenticated = false;
    
    if (authHeader?.startsWith("Bearer ")) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const token = authHeader.replace("Bearer ", "");
      
      // Check if it's a real user token (not just the anon key)
      if (token !== supabaseAnonKey) {
        try {
          const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } },
          });
          
          const { data: { user }, error } = await supabase.auth.getUser();
          
          if (!error && user) {
            isAuthenticated = true;
          }
        } catch {
          // Token validation failed, treat as anonymous
          isAuthenticated = false;
        }
      }
    }

    // Apply rate limiting
    const { allowed, remaining } = checkRateLimit(clientIP, isAuthenticated);
    
    if (!allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}, authenticated: ${isAuthenticated}`);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": "0",
            "Retry-After": "60"
          } 
        }
      );
    }
    
    // Cleanup old rate limit entries occasionally
    if (Math.random() < 0.1) {
      cleanupRateLimitMap();
    }

    const { text, voiceId } = await req.json();
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    if (!text) {
      throw new Error("Text is required");
    }

    // Stricter limits for anonymous users
    const maxTextLength = isAuthenticated ? 1000 : 500;
    if (text.length > maxTextLength) {
      throw new Error(`Text too long - maximum ${maxTextLength} characters`);
    }

    // Validate text content (prevent injection of control characters)
    const sanitizedText = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    const voice = voiceId || "onwK4e9ZLuTAKqWW03F9"; // Daniel - Portuguese friendly voice

    console.log(`TTS request: IP=${clientIP}, authenticated=${isAuthenticated}, textLength=${sanitizedText.length}, remaining=${remaining}`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: sanitizedText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
