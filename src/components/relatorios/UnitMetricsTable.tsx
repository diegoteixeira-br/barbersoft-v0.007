import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

interface UnitMetrics {
  unitId: string;
  unitName: string;
  totalClients: number;
  totalVisits: number;
  activeClients: number;
  inactiveClients: number;
  birthdayClients: number;
  newClientsThisMonth: number;
}

interface UnitMetricsTableProps {
  data: UnitMetrics[];
}

export function UnitMetricsTable({ data }: UnitMetricsTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma unidade encontrada
      </div>
    );
  }

  const totals = data.reduce(
    (acc, unit) => ({
      totalClients: acc.totalClients + unit.totalClients,
      totalVisits: acc.totalVisits + unit.totalVisits,
      activeClients: acc.activeClients + unit.activeClients,
      inactiveClients: acc.inactiveClients + unit.inactiveClients,
      birthdayClients: acc.birthdayClients + unit.birthdayClients,
      newClientsThisMonth: acc.newClientsThisMonth + unit.newClientsThisMonth,
    }),
    {
      totalClients: 0,
      totalVisits: 0,
      activeClients: 0,
      inactiveClients: 0,
      birthdayClients: 0,
      newClientsThisMonth: 0,
    }
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground">Unidade</TableHead>
            <TableHead className="text-muted-foreground text-center">Total</TableHead>
            <TableHead className="text-muted-foreground text-center">Ativos</TableHead>
            <TableHead className="text-muted-foreground text-center">Inativos</TableHead>
            <TableHead className="text-muted-foreground text-center">Aniversariantes</TableHead>
            <TableHead className="text-muted-foreground text-center">Novos (Mês)</TableHead>
            <TableHead className="text-muted-foreground text-center">Visitas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((unit) => (
            <TableRow key={unit.unitId} className="border-border">
              <TableCell>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-medium">{unit.unitName}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline">{unit.totalClients}</Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge className="bg-success/10 text-success border-success/30">
                  {unit.activeClients}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/30">
                  {unit.inactiveClients}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge className="bg-gold/10 text-gold border-gold/30">
                  {unit.birthdayClients}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                  {unit.newClientsThisMonth}
                </Badge>
              </TableCell>
              <TableCell className="text-center font-medium">{unit.totalVisits}</TableCell>
            </TableRow>
          ))}
          
          {/* Totals Row */}
          <TableRow className="border-border bg-secondary/30 font-semibold">
            <TableCell>
              <span className="text-primary">TOTAL</span>
            </TableCell>
            <TableCell className="text-center">{totals.totalClients}</TableCell>
            <TableCell className="text-center text-success">{totals.activeClients}</TableCell>
            <TableCell className="text-center text-destructive">{totals.inactiveClients}</TableCell>
            <TableCell className="text-center text-gold">{totals.birthdayClients}</TableCell>
            <TableCell className="text-center text-blue-500">{totals.newClientsThisMonth}</TableCell>
            <TableCell className="text-center">{totals.totalVisits}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
