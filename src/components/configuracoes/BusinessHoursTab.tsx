import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBusinessHours } from "@/hooks/useBusinessHours";
import { Clock, CalendarIcon, Plus, Trash2, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function BusinessHoursTab() {
  const {
    businessHours,
    holidays,
    isLoading,
    initializeDefaultHours,
    updateBusinessHour,
    addHoliday,
    removeHoliday,
    getWeekConfiguration,
    DAY_NAMES,
  } = useBusinessHours();

  const [newHolidayDate, setNewHolidayDate] = useState<Date>();
  const [newHolidayName, setNewHolidayName] = useState("");
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);
  const [localHours, setLocalHours] = useState<Record<number, { is_open: boolean; opening_time: string; closing_time: string }>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize default hours if none exist
  useEffect(() => {
    if (!isLoading && businessHours.length === 0) {
      initializeDefaultHours.mutate();
    }
  }, [isLoading, businessHours.length]);

  // Initialize local state from business hours
  useEffect(() => {
    if (businessHours.length > 0) {
      const hoursMap: Record<number, { is_open: boolean; opening_time: string; closing_time: string }> = {};
      businessHours.forEach(hour => {
        hoursMap[hour.day_of_week] = {
          is_open: hour.is_open,
          opening_time: hour.opening_time || "10:00",
          closing_time: hour.closing_time || "21:00",
        };
      });
      setLocalHours(hoursMap);
    }
  }, [businessHours]);

  const handleToggleDay = (dayOfWeek: number, isOpen: boolean) => {
    setLocalHours(prev => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        is_open: isOpen,
      },
    }));
    setHasChanges(true);
  };

  const handleTimeChange = (dayOfWeek: number, field: "opening_time" | "closing_time", value: string) => {
    setLocalHours(prev => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSaveHours = async () => {
    for (const [dayStr, hours] of Object.entries(localHours)) {
      const dayOfWeek = parseInt(dayStr);
      await updateBusinessHour.mutateAsync({
        day_of_week: dayOfWeek,
        is_open: hours.is_open,
        opening_time: hours.is_open ? hours.opening_time : null,
        closing_time: hours.is_open ? hours.closing_time : null,
      });
    }
    setHasChanges(false);
  };

  const handleAddHoliday = async () => {
    if (!newHolidayDate || !newHolidayName.trim()) return;

    await addHoliday.mutateAsync({
      date: format(newHolidayDate, "yyyy-MM-dd"),
      name: newHolidayName.trim(),
    });

    setNewHolidayDate(undefined);
    setNewHolidayName("");
    setHolidayDialogOpen(false);
  };

  const weekConfig = getWeekConfiguration();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Business Hours Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horários de Funcionamento
          </CardTitle>
          <CardDescription>
            Configure os horários de abertura e fechamento para cada dia da semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Dia</TableHead>
                <TableHead className="w-[100px] text-center">Aberto</TableHead>
                <TableHead className="text-center">Abertura</TableHead>
                <TableHead className="text-center">Fechamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weekConfig.map((config, index) => {
                const dayOfWeek = config.day_of_week;
                const localConfig = localHours[dayOfWeek] || {
                  is_open: config.is_open,
                  opening_time: config.opening_time || "10:00",
                  closing_time: config.closing_time || "21:00",
                };

                return (
                  <TableRow key={dayOfWeek}>
                    <TableCell className="font-medium">{DAY_NAMES[dayOfWeek]}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={localConfig.is_open}
                        onCheckedChange={(checked) => handleToggleDay(dayOfWeek, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="time"
                        value={localConfig.opening_time}
                        onChange={(e) => handleTimeChange(dayOfWeek, "opening_time", e.target.value)}
                        disabled={!localConfig.is_open}
                        className="w-[120px] mx-auto"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="time"
                        value={localConfig.closing_time}
                        onChange={(e) => handleTimeChange(dayOfWeek, "closing_time", e.target.value)}
                        disabled={!localConfig.is_open}
                        className="w-[120px] mx-auto"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleSaveHours}
              disabled={!hasChanges || updateBusinessHour.isPending}
            >
              {updateBusinessHour.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Holidays Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Feriados
              </CardTitle>
              <CardDescription>
                Adicione datas em que o estabelecimento estará fechado
              </CardDescription>
            </div>
            <Dialog open={holidayDialogOpen} onOpenChange={setHolidayDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Feriado</DialogTitle>
                  <DialogDescription>
                    Selecione a data e informe o nome do feriado
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newHolidayDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newHolidayDate ? (
                            format(newHolidayDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          ) : (
                            "Selecione uma data"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newHolidayDate}
                          onSelect={setNewHolidayDate}
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome do Feriado</Label>
                    <Input
                      placeholder="Ex: Natal, Ano Novo, etc."
                      value={newHolidayName}
                      onChange={(e) => setNewHolidayName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setHolidayDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddHoliday}
                    disabled={!newHolidayDate || !newHolidayName.trim() || addHoliday.isPending}
                  >
                    {addHoliday.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Adicionar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {holidays.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum feriado cadastrado
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.map((holiday) => (
                  <TableRow key={holiday.id}>
                    <TableCell>
                      {format(parseISO(holiday.date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{holiday.name}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeHoliday.mutate(holiday.id)}
                        disabled={removeHoliday.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
