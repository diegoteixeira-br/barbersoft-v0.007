import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RemainingSpotData {
  remaining: number;
  message: string;
  hasSpots: boolean;
}

export function useRemainingSpots() {
  const [remainingSpots, setRemainingSpots] = useState<number>(20);
  const [message, setMessage] = useState<string>("Vagas disponíveis");
  const [hasSpots, setHasSpots] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRemainingSpots() {
      try {
        const { data, error } = await supabase.functions.invoke<RemainingSpotData>("get-remaining-spots");
        
        if (error) {
          console.error("Error fetching remaining spots:", error);
          return;
        }

        if (data) {
          setRemainingSpots(data.remaining);
          setMessage(data.message);
          setHasSpots(data.hasSpots);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRemainingSpots();

    // Subscribe to realtime updates on companies table
    const channel = supabase
      .channel("companies-count")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "companies",
        },
        () => {
          // Refetch when a new company is created
          fetchRemainingSpots();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { remainingSpots, message, hasSpots, isLoading };
}
