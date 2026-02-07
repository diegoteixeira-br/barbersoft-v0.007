import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface UnitMetrics {
  unitId: string;
  unitName: string;
  newClientsThisMonth: number;
}

interface NewClientsChartProps {
  data: UnitMetrics[];
}

export function NewClientsChart({ data }: NewClientsChartProps) {
  const chartData = data.map((item) => ({
    name: item.unitName.length > 20 ? item.unitName.slice(0, 20) + "..." : item.unitName,
    fullName: item.unitName,
    newClients: item.newClientsThisMonth,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <YAxis
          type="category"
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          width={90}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
          formatter={(value: number) => [`${value} novos clientes`, "Este mês"]}
          labelFormatter={(_, payload) => payload[0]?.payload?.fullName || ""}
        />
        <Bar dataKey="newClients" fill="hsl(var(--gold))" radius={[0, 4, 4, 0]}>
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill="hsl(var(--gold))" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
