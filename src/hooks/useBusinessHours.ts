import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, getDay, parseISO } from "date-fns";

export interface BusinessHour {
  id: string;
  user_id: string;
  day_of_week: number;
  is_open: boolean;
  opening_time: string | null;
  closing_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface Holiday {
  id: string;
  user_id: string;
  date: string;
  name: string;
  created_at: string;
}

const DAY_NAMES = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const DEFAULT_HOURS = [
  { day_of_week: 0, is_open: false, opening_time: null, closing_time: null }, // Domingo
  { day_of_week: 1, is_open: true, opening_time: "10:00", closing_time: "21:00" },
  { day_of_week: 2, is_open: true, opening_time: "10:00", closing_time: "21:00" },
  { day_of_week: 3, is_open: true, opening_time: "10:00", closing_time: "21:00" },
  { day_of_week: 4, is_open: true, opening_time: "10:00", closing_time: "21:00" },
  { day_of_week: 5, is_open: true, opening_time: "10:00", closing_time: "21:00" },
  { day_of_week: 6, is_open: true, opening_time: "10:00", closing_time: "18:00" }, // Sábado
];

export function useBusinessHours() {
  const queryClient = useQueryClient();

  // Fetch business hours
  const { data: businessHours = [], isLoading: isLoadingHours } = useQuery({
    queryKey: ["business-hours"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("business_hours")
        .select("*")
        .eq("user_id", user.id)
        .order("day_of_week");

      if (error) throw error;
      return data as BusinessHour[];
    },
  });

  // Fetch holidays
  const { data: holidays = [], isLoading: isLoadingHolidays } = useQuery({
    queryKey: ["holidays"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("holidays")
        .select("*")
        .eq("user_id", user.id)
        .order("date");

      if (error) throw error;
      return data as Holiday[];
    },
  });

  // Initialize default hours if none exist
  const initializeDefaultHours = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const hoursToInsert = DEFAULT_HOURS.map(h => ({
        ...h,
        user_id: user.id,
      }));

      const { error } = await supabase
        .from("business_hours")
        .insert(hoursToInsert);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-hours"] });
    },
    onError: (error) => {
      console.error("Error initializing business hours:", error);
    },
  });

  // Update business hour
  const updateBusinessHour = useMutation({
    mutationFn: async (hour: Partial<BusinessHour> & { day_of_week: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("business_hours")
        .upsert({
          user_id: user.id,
          day_of_week: hour.day_of_week,
          is_open: hour.is_open,
          opening_time: hour.opening_time,
          closing_time: hour.closing_time,
        }, {
          onConflict: "user_id,day_of_week",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-hours"] });
      toast.success("Horário atualizado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar horário");
      console.error(error);
    },
  });

  // Add holiday
  const addHoliday = useMutation({
    mutationFn: async ({ date, name }: { date: string; name: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("holidays")
        .insert({
          user_id: user.id,
          date,
          name,
        });

      if (error) {
        if (error.code === "23505") {
          throw new Error("Já existe um feriado nesta data");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast.success("Feriado adicionado com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao adicionar feriado");
    },
  });

  // Remove holiday
  const removeHoliday = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("holidays")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast.success("Feriado removido com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao remover feriado");
      console.error(error);
    },
  });

  // Helper functions
  const getHoursForDay = (dayOfWeek: number): BusinessHour | undefined => {
    return businessHours.find(h => h.day_of_week === dayOfWeek);
  };

  const getHoursForDate = (date: Date): BusinessHour | undefined => {
    const dayOfWeek = getDay(date);
    return getHoursForDay(dayOfWeek);
  };

  const isHoliday = (date: Date): Holiday | undefined => {
    const dateStr = format(date, "yyyy-MM-dd");
    return holidays.find(h => h.date === dateStr);
  };

  const isOpenOnDate = (date: Date): boolean => {
    // Check if it's a holiday
    if (isHoliday(date)) {
      return false;
    }

    // Check day of week configuration
    const hours = getHoursForDate(date);
    if (!hours) {
      // If no configuration, use defaults
      const dayOfWeek = getDay(date);
      return dayOfWeek !== 0; // Closed on Sunday by default
    }

    return hours.is_open;
  };

  const getOpeningHours = (date: Date): { opening: string; closing: string } | null => {
    if (!isOpenOnDate(date)) {
      return null;
    }

    const hours = getHoursForDate(date);
    if (!hours || !hours.opening_time || !hours.closing_time) {
      return { opening: "10:00", closing: "21:00" }; // Default
    }

    return {
      opening: hours.opening_time,
      closing: hours.closing_time,
    };
  };

  const getDayName = (dayOfWeek: number): string => {
    return DAY_NAMES[dayOfWeek] || "";
  };

  // Get complete week configuration (with defaults for missing days)
  const getWeekConfiguration = (): (BusinessHour | typeof DEFAULT_HOURS[0] & { id?: string })[] => {
    return DEFAULT_HOURS.map(defaultHour => {
      const existingHour = businessHours.find(h => h.day_of_week === defaultHour.day_of_week);
      return existingHour || defaultHour;
    });
  };

  return {
    businessHours,
    holidays,
    isLoading: isLoadingHours || isLoadingHolidays,
    initializeDefaultHours,
    updateBusinessHour,
    addHoliday,
    removeHoliday,
    getHoursForDay,
    getHoursForDate,
    isHoliday,
    isOpenOnDate,
    getOpeningHours,
    getDayName,
    getWeekConfiguration,
    DAY_NAMES,
  };
}
