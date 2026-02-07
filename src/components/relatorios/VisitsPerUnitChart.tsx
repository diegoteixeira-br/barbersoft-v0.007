import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface UnitMetrics {
  unitId: string;
  unitName: string;
  totalVisits: number;
}

interface VisitsPerUnitChartProps {
  data: UnitMetrics[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--gold))",
  "hsl(142, 76%, 36%)",
  "hsl(217, 91%, 60%)",
  "hsl(280, 87%, 65%)",
  "hsl(330, 81%, 60%)",
];

export function VisitsPerUnitChart({ data }: VisitsPerUnitChartProps) {
  const chartData = data.map((item, index) => ({
    name: item.unitName.length > 15 ? item.unitName.slice(0, 15) + "..." : item.unitName,
    fullName: item.unitName,
    visits: item.totalVisits,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
          formatter={(value: number) => [`${value} visitas`, "Total"]}
          labelFormatter={(_, payload) => payload[0]?.payload?.fullName || ""}
        />
        <Bar dataKey="visits" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
