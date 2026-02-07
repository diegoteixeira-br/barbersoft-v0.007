import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  description?: string;
  icon: React.ReactNode;
  isLoading?: boolean;
}

export function MetricCard({ title, value, change, description, icon, isLoading }: MetricCardProps) {
  const changeType = change > 0 ? "positive" : change < 0 ? "negative" : "neutral";
  const formattedChange = change > 0 ? `+${change.toFixed(0)}%` : change < 0 ? `${change.toFixed(0)}%` : "0%";

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`flex items-center text-sm font-medium ${
              changeType === "positive"
                ? "text-success"
                : changeType === "negative"
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {changeType === "positive" ? (
              <ArrowUpRight className="mr-1 h-4 w-4" />
            ) : changeType === "negative" ? (
              <ArrowDownRight className="mr-1 h-4 w-4" />
            ) : (
              <Minus className="mr-1 h-4 w-4" />
            )}
            {formattedChange}
          </span>
          {description && <span className="text-sm text-muted-foreground">{description}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
