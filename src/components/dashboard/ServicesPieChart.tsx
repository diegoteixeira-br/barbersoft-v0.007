import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { PieChartIcon } from "lucide-react";
import { ServicePopularity } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

interface ServicesPieChartProps {
  data: ServicePopularity[];
  isLoading?: boolean;
}

export function ServicesPieChart({ data, isLoading }: ServicesPieChartProps) {
  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <PieChartIcon className="h-5 w-5 text-accent" />
            Serviços Mais Populares
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = data.length > 0;
  const totalServices = data.reduce((sum, s) => sum + s.count, 0);

  // Create chart config dynamically
  const chartConfig = data.reduce((acc, service, index) => {
    acc[service.name] = {
      label: service.name,
      color: service.fill,
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <PieChartIcon className="h-5 w-5 text-accent" />
          Serviços Mais Populares
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-[280px] items-center justify-center">
            <p className="text-muted-foreground">Nenhum serviço registrado</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <ChartContainer config={chartConfig} className="h-[200px] w-full max-w-[300px]">
              <PieChart>
                <ChartTooltip 
                  content={
                    <ChartTooltipContent 
                      formatter={(value, name) => {
                        const percentage = ((Number(value) / totalServices) * 100).toFixed(1);
                        return `${value} atendimentos (${percentage}%)`;
                      }}
                    />
                  }
                />
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="name"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4">
              {data.map((service) => {
                const percentage = ((service.count / totalServices) * 100).toFixed(0);
                return (
                  <div key={service.name} className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: service.fill }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {service.name} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
