import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface UnitMetrics {
  unitId: string;
  unitName: string;
  totalClients: number;
}

interface ClientDistributionChartProps {
  data: UnitMetrics[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--gold))",
  "hsl(142, 76%, 36%)", // green
  "hsl(217, 91%, 60%)", // blue
  "hsl(280, 87%, 65%)", // purple
  "hsl(330, 81%, 60%)", // pink
  "hsl(25, 95%, 53%)",  // orange
  "hsl(174, 83%, 38%)", // teal
];

export function ClientDistributionChart({ data }: ClientDistributionChartProps) {
  const chartData = data.map((item, index) => ({
    name: item.unitName,
    value: item.totalClients,
    color: COLORS[index % COLORS.length],
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        Nenhum cliente cadastrado
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
          formatter={(value: number) => [`${value} clientes`, "Total"]}
        />
        <Legend
          wrapperStyle={{ paddingTop: "20px" }}
          formatter={(value) => <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
