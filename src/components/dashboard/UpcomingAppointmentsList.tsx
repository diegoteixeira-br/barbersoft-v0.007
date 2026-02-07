import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CalendarX } from "lucide-react";
import { UpcomingAppointment } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface UpcomingAppointmentsListProps {
  appointments: UpcomingAppointment[];
  isLoading?: boolean;
}

export function UpcomingAppointmentsList({ appointments, isLoading }: UpcomingAppointmentsListProps) {
  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="h-5 w-5 text-primary" />
            Próximos Agendamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between px-6 py-4">
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="h-5 w-5 text-primary" />
            Próximos Agendamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 flex-col items-center justify-center gap-2">
            <CalendarX className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhum agendamento para hoje</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="outline" className="border-success text-success text-xs">Confirmado</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-warning text-warning text-xs">Pendente</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Clock className="h-5 w-5 text-primary" />
          Próximos Agendamentos
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {appointments.map((apt) => (
            <div 
              key={apt.id} 
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-secondary/50"
            >
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{apt.clientName}</span>
                <span className="text-sm text-muted-foreground">{apt.serviceName}</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-semibold text-primary">{apt.time}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{apt.barberName}</span>
                  {getStatusBadge(apt.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
