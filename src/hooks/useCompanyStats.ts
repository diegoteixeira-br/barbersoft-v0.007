import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CompanyStatsData {
  totalCompanies: number;
}

export function useCompanyStats() {
  const [totalCompanies, setTotalCompanies] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data, error } = await supabase.functions.invoke<CompanyStatsData>("get-company-stats");
        
        if (error) {
          console.error("Error fetching company stats:", error);
          return;
        }

        if (data) {
          setTotalCompanies(data.totalCompanies);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();

    // Subscribe to realtime updates on companies table
    const channel = supabase
      .channel("companies-stats")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "companies",
        },
        () => {
          // Refetch when a new company is created
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { totalCompanies, isLoading };
}
