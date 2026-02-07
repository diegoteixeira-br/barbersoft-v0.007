import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp } from "lucide-react";
import { TopBarber, formatCurrency } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

interface TopBarberCardProps {
  topBarbers: TopBarber[];
  isLoading?: boolean;
}

export function TopBarberCard({ topBarbers, isLoading }: TopBarberCardProps) {
  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Trophy className="h-5 w-5 text-primary" />
            Top Barbeiros do Mês
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (topBarbers.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Trophy className="h-5 w-5 text-primary" />
            Top Barbeiros do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground">Nenhum atendimento registrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0:
        return "from-yellow-400 to-yellow-600"; // Gold
      case 1:
        return "from-gray-300 to-gray-500"; // Silver
      case 2:
        return "from-amber-600 to-amber-800"; // Bronze
      default:
        return "from-primary to-primary/70";
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Trophy className="h-5 w-5 text-primary" />
          Top Barbeiros do Mês
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {topBarbers.map((barber, index) => (
            <div 
              key={barber.id} 
              className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-secondary/50"
            >
              <div 
                className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${getMedalColor(index)} text-sm font-bold text-white shadow-md`}
              >
                {index + 1}
              </div>
              <div className="flex flex-1 flex-col">
                <span className="font-medium text-foreground">{barber.name}</span>
                <span className="text-sm text-muted-foreground">
                  {barber.appointments} atendimentos
                </span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-gold">
                  {formatCurrency(barber.revenue)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
