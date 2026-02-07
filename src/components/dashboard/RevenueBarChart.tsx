import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { BarChart3 } from "lucide-react";
import { DailyRevenue, formatCurrency } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

interface RevenueBarChartProps {
  data: DailyRevenue[];
  isLoading?: boolean;
}

const chartConfig = {
  revenue: {
    label: "Faturamento",
    color: "hsl(var(--primary))",
  },
};

export function RevenueBarChart({ data, isLoading }: RevenueBarChartProps) {
  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <BarChart3 className="h-5 w-5 text-primary" />
            Faturamento - Últimos 7 Dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = data.some(d => d.revenue > 0);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <BarChart3 className="h-5 w-5 text-primary" />
          Faturamento - Últimos 7 Dias
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-[280px] items-center justify-center">
            <p className="text-muted-foreground">Nenhum faturamento no período</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <XAxis 
                dataKey="dayShort" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$${value}`}
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value) => formatCurrency(Number(value))}
                    labelFormatter={(label, payload) => {
                      if (payload?.[0]?.payload) {
                        return payload[0].payload.day;
                      }
                      return label;
                    }}
                  />
                }
              />
              <Bar 
                dataKey="revenue" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
