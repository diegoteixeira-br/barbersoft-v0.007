import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUnit } from "@/contexts/UnitContext";

export interface AppointmentHistoryRecord {
  id: string;
  client_name: string;
  client_phone: string | null;
  start_time: string;
  end_time: string;
  total_price: number;
  notes: string | null;
  barber: {
    id: string;
    name: string;
  } | null;
  service: {
    id: string;
    name: string;
  } | null;
}

interface UseAppointmentHistoryOptions {
  startDate?: Date;
  endDate?: Date;
  barberId?: string;
  serviceId?: string;
}

export function useAppointmentHistory(options: UseAppointmentHistoryOptions = {}) {
  const { currentUnitId } = useCurrentUnit();
  const { startDate, endDate, barberId, serviceId } = options;

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "appointment-history",
      currentUnitId,
      startDate?.toISOString(),
      endDate?.toISOString(),
      barberId,
      serviceId,
    ],
    queryFn: async () => {
      if (!currentUnitId) return { records: [], summary: getEmptySummary() };

      let query = supabase
        .from("appointments")
        .select(`
          id,
          client_name,
          client_phone,
          start_time,
          end_time,
          total_price,
          notes,
          barber:barbers(id, name),
          service:services(id, name)
        `)
        .eq("unit_id", currentUnitId)
        .eq("status", "completed")
        .order("start_time", { ascending: false });

      if (startDate) {
        query = query.gte("start_time", startDate.toISOString());
      }
      if (endDate) {
        query = query.lte("start_time", endDate.toISOString());
      }
      if (barberId) {
        query = query.eq("barber_id", barberId);
      }
      if (serviceId) {
        query = query.eq("service_id", serviceId);
      }

      const { data: records, error } = await query;

      if (error) throw error;

      const formattedRecords = (records || []).map((item) => ({
        ...item,
        barber: Array.isArray(item.barber) ? item.barber[0] : item.barber,
        service: Array.isArray(item.service) ? item.service[0] : item.service,
      })) as AppointmentHistoryRecord[];

      // Calculate summary
      const totalCount = formattedRecords.length;
      const totalRevenue = formattedRecords.reduce((sum, r) => sum + Number(r.total_price), 0);
      const averageTicket = totalCount > 0 ? totalRevenue / totalCount : 0;

      // Find top barber
      const barberStats: Record<string, { name: string; count: number; revenue: number }> = {};
      formattedRecords.forEach((r) => {
        if (r.barber) {
          if (!barberStats[r.barber.id]) {
            barberStats[r.barber.id] = { name: r.barber.name, count: 0, revenue: 0 };
          }
          barberStats[r.barber.id].count++;
          barberStats[r.barber.id].revenue += Number(r.total_price);
        }
      });

      const topBarber = Object.values(barberStats).sort((a, b) => b.revenue - a.revenue)[0] || null;

      return {
        records: formattedRecords,
        summary: {
          totalCount,
          totalRevenue,
          averageTicket,
          topBarber,
        },
      };
    },
    enabled: !!currentUnitId,
  });

  return {
    records: data?.records || [],
    summary: data?.summary || getEmptySummary(),
    isLoading,
    refetch,
  };
}

function getEmptySummary() {
  return {
    totalCount: 0,
    totalRevenue: 0,
    averageTicket: 0,
    topBarber: null as { name: string; count: number; revenue: number } | null,
  };
}
