import { useState } from "react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Phone, DollarSign, Filter, Users, TrendingUp, Award, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppointmentHistory } from "@/hooks/useAppointmentHistory";
import { useBarbers } from "@/hooks/useBarbers";
import { useServices } from "@/hooks/useServices";
import { useCurrentUnit } from "@/contexts/UnitContext";

type PeriodFilter = "7d" | "30d" | "month" | "all";

export function AppointmentHistoryTab() {
  const { currentUnitId } = useCurrentUnit();
  const [period, setPeriod] = useState<PeriodFilter>("30d");
  const [selectedBarberId, setSelectedBarberId] = useState<string>("all");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("all");

  const { barbers } = useBarbers(currentUnitId);
  const { services } = useServices(currentUnitId);

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case "7d":
        return { startDate: subDays(now, 7), endDate: now };
      case "30d":
        return { startDate: subDays(now, 30), endDate: now };
      case "month":
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      case "all":
        return {};
    }
  };

  const { records, isLoading, summary } = useAppointmentHistory({
    ...getDateRange(),
    barberId: selectedBarberId !== "all" ? selectedBarberId : undefined,
    serviceId: selectedServiceId !== "all" ? selectedServiceId : undefined,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Total de Atendimentos
            </CardDescription>
            <CardTitle className="text-2xl">{summary.totalCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-primary" />
              Faturamento Total
            </CardDescription>
            <CardTitle className="text-2xl text-primary">
              R$ {summary.totalRevenue.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Ticket Médio
            </CardDescription>
            <CardTitle className="text-2xl">
              R$ {summary.averageTicket.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Award className="h-3 w-3 text-amber-500" />
              Top Profissional
            </CardDescription>
            <CardTitle className="text-lg truncate">
              {summary.topBarber ? (
                <span title={`${summary.topBarber.count} atendimentos - R$ ${summary.topBarber.revenue.toFixed(2)}`}>
                  {summary.topBarber.name}
                </span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtros:</span>
        </div>

        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
          <SelectTrigger className="w-[150px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="month">Este mês</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedBarberId} onValueChange={setSelectedBarberId}>
          <SelectTrigger className="w-[180px]">
            <Users className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Profissional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os profissionais</SelectItem>
            {barbers.map((barber) => (
              <SelectItem key={barber.id} value={barber.id}>
                {barber.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Serviço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os serviços</SelectItem>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Obs.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8" />
                      <span>Nenhum atendimento concluído encontrado</span>
                      <span className="text-sm">Atendimentos finalizados aparecerão aqui</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {format(new Date(record.start_time), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(record.start_time), "HH:mm")} - {format(new Date(record.end_time), "HH:mm")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{record.client_name}</span>
                        {record.client_phone && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {record.client_phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.barber?.name || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.service?.name ? (
                        <Badge variant="secondary">{record.service.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      R$ {Number(record.total_price).toFixed(2)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {record.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
