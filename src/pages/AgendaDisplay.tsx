import { useState, useEffect, useMemo, useCallback } from "react";
import { format, startOfDay, endOfDay, setHours, setMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Settings, Maximize, Minimize, ChevronLeft, ChevronRight, Users, RotateCw } from "lucide-react";
import { useAppointments, type Appointment } from "@/hooks/useAppointments";
import { useBarbers, type Barber } from "@/hooks/useBarbers";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useUnits } from "@/hooks/useUnits";
import { useCurrentUnit } from "@/contexts/UnitContext";
import { useCurrentTime } from "@/hooks/useCurrentTime";
import { CalendarEvent } from "@/components/agenda/CalendarEvent";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { UnitProvider } from "@/contexts/UnitContext";

interface DisplaySettings {
  mode: "all" | "rotate";
  rotationInterval: number;
  showClock: boolean;
  selectedBarberId: string | null;
}

function AgendaDisplayContent() {
  const { currentUnitId } = useCurrentUnit();
  const [currentDate] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentBarberIndex, setCurrentBarberIndex] = useState(0);
  const [settings, setSettings] = useState<DisplaySettings>(() => {
    const saved = localStorage.getItem("agenda-display-settings");
    return saved ? JSON.parse(saved) : {
      mode: "all",
      rotationInterval: 15,
      showClock: true,
      selectedBarberId: null,
    };
  });

  const { barbers } = useBarbers(currentUnitId);
  const { settings: businessSettings } = useBusinessSettings();
  const { units } = useUnits();
  
  const currentUnit = useMemo(() => units?.find(u => u.id === currentUnitId), [units, currentUnitId]);
  const timezone = currentUnit?.timezone;
  
  const { hour: currentHour, minute: currentMinute, isToday } = useCurrentTime(timezone);
  const today = isToday(currentDate);

  const dateRange = useMemo(() => ({
    start: startOfDay(currentDate),
    end: endOfDay(currentDate),
  }), [currentDate]);

  const { appointments: allAppointments, refetch } = useAppointments(dateRange.start, dateRange.end);
  
  const appointments = useMemo(() => 
    allAppointments.filter(apt => apt.status !== "cancelled"),
    [allAppointments]
  );

  // Parse business hours
  const openingHour = businessSettings?.opening_time ? parseInt(businessSettings.opening_time.split(":")[0], 10) : 8;
  const closingHour = businessSettings?.closing_time ? parseInt(businessSettings.closing_time.split(":")[0], 10) : 20;
  const visibleHours = closingHour - openingHour;
  
  // Generate hours array based on business hours
  const HOURS = useMemo(() => 
    Array.from({ length: visibleHours }, (_, i) => i + openingHour),
    [visibleHours, openingHour]
  );

  // Calculate compact height
  const [containerHeight, setContainerHeight] = useState(0);
  const headerHeight = 80;
  const barberHeaderHeight = 56;
  const availableHeight = containerHeight - headerHeight - barberHeaderHeight;
  const hourHeight = Math.max(40, Math.floor(availableHeight / visibleHours));

  // Get active barbers
  const activeBarbers = useMemo(() => 
    barbers.filter(b => b.is_active),
    [barbers]
  );

  // Get displayed barbers based on settings
  const displayedBarbers = useMemo(() => {
    if (settings.selectedBarberId) {
      return activeBarbers.filter(b => b.id === settings.selectedBarberId);
    }
    if (settings.mode === "rotate" && activeBarbers.length > 0) {
      return [activeBarbers[currentBarberIndex % activeBarbers.length]];
    }
    return activeBarbers;
  }, [activeBarbers, settings.mode, settings.selectedBarberId, currentBarberIndex]);

  // Rotation effect
  useEffect(() => {
    if (settings.mode !== "rotate" || settings.selectedBarberId || activeBarbers.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentBarberIndex(prev => (prev + 1) % activeBarbers.length);
    }, settings.rotationInterval * 1000);
    
    return () => clearInterval(interval);
  }, [settings.mode, settings.rotationInterval, settings.selectedBarberId, activeBarbers.length]);

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(() => refetch(), 60000);
    return () => clearInterval(interval);
  }, [refetch]);

  // Container height measurement
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const updateHeight = () => setContainerHeight(node.clientHeight);
      updateHeight();
      window.addEventListener("resize", updateHeight);
      return () => window.removeEventListener("resize", updateHeight);
    }
  }, []);

  // Save settings
  useEffect(() => {
    localStorage.setItem("agenda-display-settings", JSON.stringify(settings));
  }, [settings]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Appointments by barber and hour
  const appointmentsByBarberAndHour = useMemo(() => {
    const map: Record<string, Record<number, Appointment[]>> = {};
    displayedBarbers.forEach(barber => {
      map[barber.id] = {};
      HOURS.forEach(hour => {
        map[barber.id][hour] = [];
      });
    });
    appointments.forEach(apt => {
      if (!apt.barber_id || !map[apt.barber_id]) return;
      const hour = new Date(apt.start_time).getHours();
      if (map[apt.barber_id][hour]) {
        map[apt.barber_id][hour].push(apt);
      }
    });
    return map;
  }, [appointments, displayedBarbers, HOURS]);

  // Current time indicator
  const showTimeIndicator = today && currentHour >= openingHour && currentHour < closingHour;
  const timeIndicatorPosition = (currentHour - openingHour) * hourHeight + (currentMinute / 60) * hourHeight;

  const isWithinBusinessHours = (hour: number) => hour >= openingHour && hour < closingHour;

  return (
    <div ref={containerRef} className="h-screen w-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0" style={{ height: headerHeight }}>
        <div className="flex items-center gap-4">
          {settings.showClock && (
            <div className="text-4xl font-bold tabular-nums text-primary">
              {String(currentHour).padStart(2, "0")}:{String(currentMinute).padStart(2, "0")}
            </div>
          )}
          <div className="text-muted-foreground">
            <div className="font-semibold">{currentUnit?.name || "Agenda"}</div>
            <div className="text-sm capitalize">
              {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {settings.mode === "rotate" && !settings.selectedBarberId && activeBarbers.length > 1 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
              <RotateCw className="h-4 w-4 animate-spin" style={{ animationDuration: `${settings.rotationInterval}s` }} />
              <span>
                {currentBarberIndex + 1}/{activeBarbers.length}
              </span>
            </div>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <div className="space-y-4">
                <h4 className="font-semibold">Configurações do Display</h4>
                
                <div className="space-y-2">
                  <Label>Profissional</Label>
                  <Select
                    value={settings.selectedBarberId || "auto"}
                    onValueChange={(v) => setSettings(s => ({ ...s, selectedBarberId: v === "auto" ? null : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Automático
                        </div>
                      </SelectItem>
                      {activeBarbers.map(barber => (
                        <SelectItem key={barber.id} value={barber.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: barber.calendar_color || "#FF6B00" }} />
                            {barber.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!settings.selectedBarberId && (
                  <div className="space-y-2">
                    <Label>Modo de Exibição</Label>
                    <Select
                      value={settings.mode}
                      onValueChange={(v) => setSettings(s => ({ ...s, mode: v as "all" | "rotate" }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos ao mesmo tempo</SelectItem>
                        <SelectItem value="rotate">Rotação automática</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {settings.mode === "rotate" && !settings.selectedBarberId && (
                  <div className="space-y-2">
                    <Label>Intervalo de Rotação</Label>
                    <Select
                      value={String(settings.rotationInterval)}
                      onValueChange={(v) => setSettings(s => ({ ...s, rotationInterval: parseInt(v, 10) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 segundos</SelectItem>
                        <SelectItem value="15">15 segundos</SelectItem>
                        <SelectItem value="30">30 segundos</SelectItem>
                        <SelectItem value="60">1 minuto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-clock">Mostrar relógio</Label>
                  <Switch
                    id="show-clock"
                    checked={settings.showClock}
                    onCheckedChange={(checked) => setSettings(s => ({ ...s, showClock: checked }))}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="icon" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Barber Headers */}
          <div 
            className="grid border-b border-border bg-card shrink-0" 
            style={{ 
              gridTemplateColumns: `80px repeat(${displayedBarbers.length}, 1fr)`,
              height: barberHeaderHeight,
            }}
          >
            <div className="p-3 text-center border-r border-border flex items-center justify-center">
              <span className="text-sm text-muted-foreground">Horário</span>
            </div>
            {displayedBarbers.map(barber => (
              <div
                key={barber.id}
                className="p-3 text-center border-r border-border last:border-r-0 flex items-center justify-center"
                style={{ borderTop: `4px solid ${barber.calendar_color || "#FF6B00"}` }}
              >
                <p className="font-semibold text-lg">{barber.name}</p>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          <div 
            className="grid relative flex-1 overflow-hidden" 
            style={{ gridTemplateColumns: `80px repeat(${displayedBarbers.length}, 1fr)` }}
          >
            {/* Current time indicator */}
            {showTimeIndicator && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none"
                style={{ top: `${timeIndicatorPosition}px` }}
              >
                <div className="relative flex items-center">
                  <div className="absolute left-[68px] w-3 h-3 bg-red-500 rounded-full shadow-sm" />
                  <div className="ml-[80px] flex-1 h-0.5 bg-red-500" />
                </div>
              </div>
            )}

            {/* Time column */}
            <div className="border-r border-border">
              {HOURS.map(hour => (
                <div
                  key={hour}
                  className={`border-b border-border flex items-start justify-end pr-2 pt-1 ${
                    isWithinBusinessHours(hour) ? "bg-blue-100/40 dark:bg-blue-900/20" : ""
                  }`}
                  style={{ height: hourHeight }}
                >
                  <span className="text-sm text-muted-foreground">
                    {String(hour).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Barber columns */}
            {displayedBarbers.map(barber => (
              <div key={barber.id} className="border-r border-border last:border-r-0">
                {HOURS.map(hour => {
                  const slotAppointments = appointmentsByBarberAndHour[barber.id]?.[hour] || [];
                  const withinHours = isWithinBusinessHours(hour);

                  return (
                    <div
                      key={hour}
                      className={`border-b border-border p-1 ${
                        withinHours 
                          ? "bg-blue-100/40 dark:bg-blue-900/20" 
                          : ""
                      } ${today && withinHours ? "bg-blue-100/50 dark:bg-blue-900/30" : ""}`}
                      style={{ height: hourHeight }}
                    >
                      <div className="space-y-1 overflow-hidden h-full">
                        {slotAppointments.map(apt => (
                          <CalendarEvent
                            key={apt.id}
                            appointment={apt}
                            onClick={() => {}}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgendaDisplay() {
  return (
    <AuthGuard>
      <UnitProvider>
        <AgendaDisplayContent />
      </UnitProvider>
    </AuthGuard>
  );
}
