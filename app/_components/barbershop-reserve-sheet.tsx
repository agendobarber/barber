
// app/_components/barbershop-reserve-sheet.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ptBR } from "date-fns/locale";
import { setHours, setMinutes, isPast, isToday } from "date-fns";

import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "./ui/sheet";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Calendar } from "./ui/calendar";

import SignInDialog from "./sign-in-dialog";
import { createBooking } from "../_actions/create-booking";
import { getBookings } from "../_actions/get-bookings";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/** Tipos mínimos para este componente */
type Professional = { id: string; name: string; status: number };
type Service = { id: string; name: string; price: number; tempo: number; status?: number };
type Booking = { id: string; date: string | Date; endDate: string | Date };

type BarbershopProps = {
  id: string;
  name: string;
  imageUrl: string;
  address?: string;
  phones?: string[];
  professionals: Professional[];
  services: Service[]; // usado apenas como fallback; o fluxo pega serviços do profissional via API
};

type Props = {
  barbershop: BarbershopProps;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean; // default: true
};

/** Gera slots de 30 min baseado na agenda (startTime/endTime) do profissional no dia selecionado */
const generateProfessionalTimeSlots = (
  schedules: { dayOfWeek: number; startTime: string; endTime: string }[],
  selectedDay: Date
): string[] => {
  const dayOfWeek = selectedDay.getDay(); // 0-dom .. 6-sáb
  const slots: string[] = [];

  schedules.forEach((s) => {
    if (s.dayOfWeek === dayOfWeek) {
      const [startHour, startMin] = s.startTime.split(":").map(Number);
      const [endHour, endMin] = s.endTime.split(":").map(Number);

      let current = setHours(setMinutes(new Date(selectedDay), startMin), startHour);
      const endTime = setHours(setMinutes(new Date(selectedDay), endMin), endHour);

      while (current < endTime) {
        slots.push(
          `${String(current.getHours()).padStart(2, "0")}:${String(current.getMinutes()).padStart(2, "0")}`
        );
        current = new Date(current.getTime() + 30 * 60000); // +30 min
      }
    }
  });

  return slots;
};

/** Marca slots indisponíveis se passado (no dia de hoje) ou se conflitam com bookings existentes */
const getTimeStatusList = ({
  professionalSchedules,
  bookings,
  selectedDay,
}: {
  professionalSchedules: { dayOfWeek: number; startTime: string; endTime: string }[];
  bookings: Booking[];
  selectedDay: Date;
}) => {
  const availableSlots = generateProfessionalTimeSlots(professionalSchedules, selectedDay);

  return availableSlots.map((time) => {
    const [hour, minute] = time.split(":").map(Number);
    const current = setHours(setMinutes(new Date(selectedDay), minute), hour);

    const timeInPast = isPast(current) && isToday(selectedDay);
    const isBooked = bookings.some((b) => {
      const start = new Date(b.date);
      const end = new Date(b.endDate);
      return current >= start && current < end;
    });

    return { time, disabled: timeInPast || isBooked };
  });
};

export default function BarbershopReserveSheet({
  barbershop,
  open,
  onOpenChange,
  showTrigger = true,
}: Props) {
  /** Controlado/semicontrolado via props */
  const [sheetOpen, setSheetOpen] = useState<boolean>(open ?? false);
  useEffect(() => setSheetOpen(open ?? false), [open]);
  const handleOpenChange = (o: boolean) => {
    setSheetOpen(o);
    onOpenChange?.(o);
  };

  const { data } = useSession();
  const { data: session } = useSession();
  const router = useRouter();

  /** Estado principal do fluxo */
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [professionalServices, setProfessionalServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);

  const [dayBookings, setDayBookings] = useState<Booking[]>([]);
  const [professionalSchedules, setProfessionalSchedules] = useState<
    { dayOfWeek: number; startTime: string; endTime: string }[]
  >([]);

  const [signInDialogOpen, setSignInDialogOpen] = useState(false);

  /** Cache de bookings por (profissional + dia) para evitar chamadas repetidas */
  const bookingsCache = useRef<{ [key: string]: Booking[] }>({});

  /** Abrir o sheet, pedindo login se necessário */
  const handleBookingClick = () => {
    if (!data?.user) return setSignInDialogOpen(true);
    handleOpenChange(true);
  };

  /** Seleciona/alternar profissional e busca seus serviços/agenda via API */
  const selectProfessional = async (id: string) => {
    if (selectedProfessional === id) {
      // desmarca
      setSelectedProfessional(null);
      setProfessionalServices([]);
      setSelectedServices([]);
      setSelectedDay(undefined);
      setSelectedTimes([]);
      setDayBookings([]);
      setProfessionalSchedules([]);
      return;
    }

    setSelectedProfessional(id);
    setSelectedTimes([]);
    setSelectedServices([]);

    try {
      // Agenda do profissional
      const resSchedules = await fetch(`/api/professionals/${id}/schedules`);
      const schedules = await resSchedules.json();
      setProfessionalSchedules(schedules || []);

      // Serviços do profissional
      const resServices = await fetch(`/api/professionals/${id}/services`);
      const services = await resServices.json();
      setProfessionalServices((services || []).filter((s: Service) => (s.status ?? 1) === 1));
    } catch (err) {
      console.error(err);
      setProfessionalSchedules([]);
      setProfessionalServices([]);
    }

    // Se já houver dia selecionado, carrega bookings desse profissional para o dia
    if (!selectedDay) {
      setDayBookings([]);
      return;
    }

    const cacheKey = `${id}_${selectedDay.toDateString()}`;
    if (bookingsCache.current[cacheKey]) {
      setDayBookings(bookingsCache.current[cacheKey]);
    } else {
      const bookings = await getBookings({ date: selectedDay, professionalId: id });
      bookingsCache.current[cacheKey] = bookings;
      setDayBookings(bookings);
    }
  };

  /** Busca bookings ao mudar dia/profissional, usando cache */
  useEffect(() => {
    if (!selectedDay || !selectedProfessional) return setDayBookings([]);

    const cacheKey = `${selectedProfessional}_${selectedDay.toDateString()}`;
    if (bookingsCache.current[cacheKey]) {
      setDayBookings(bookingsCache.current[cacheKey]);
      return;
    }

    let mounted = true;
    const fetchBookings = async () => {
      const bookings = await getBookings({ date: selectedDay, professionalId: selectedProfessional! });
      bookingsCache.current[cacheKey] = bookings;
      if (mounted) setDayBookings(bookings);
    };
    fetchBookings();

    return () => {
      mounted = false;
    };
  }, [selectedDay, selectedProfessional]);

  /** Selecionar/deselecionar serviço */
  const toggleService = (id: string) => {
    setSelectedServices((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setSelectedTimes([]); // limpar horários se alterar serviços
  };

  /** Total em R$ e tempo total (min) */
  const total = useMemo(
    () =>
      professionalServices
        .filter((s) => selectedServices.includes(s.id))
        .reduce((acc, s) => acc + Number(s.price || 0), 0),
    [selectedServices, professionalServices]
  );

  const totalTempo = useMemo(
    () =>
      professionalServices
        .filter((s) => selectedServices.includes(s.id))
        .reduce((acc, s) => acc + (s.tempo || 0), 0),
    [selectedServices, professionalServices]
  );

  const roundedSlots = Math.ceil(totalTempo / 30); // número de slots de 30min necessários

  /** Seleção de horários contíguos com base nos slots necessários */
  const handleTimeClick = (time: string) => {
    if (!selectedDay || !selectedProfessional || selectedServices.length === 0) {
      return toast.error("Selecione barbeiro, serviço e dia antes de escolher o horário.");
    }

    const status = getTimeStatusList({ bookings: dayBookings, selectedDay, professionalSchedules });
    const clicked = status.find((s) => s.time === time);
    if (!clicked || clicked.disabled) return toast.error("Horário indisponível.");

    const availableTimes = status.filter((t) => !t.disabled).map((t) => t.time);
    const startIndex = availableTimes.indexOf(time);
    const timesToSelect = availableTimes.slice(startIndex, startIndex + roundedSlots);

    if (timesToSelect.length < roundedSlots) {
      return toast.error("Não há horários suficientes disponíveis.");
    }

    setSelectedTimes(timesToSelect);
  };

  /** Lista de horários com disponibilidade real */
  const statusList = useMemo(() => {
    return selectedDay ? getTimeStatusList({ bookings: dayBookings, selectedDay, professionalSchedules }) : [];
  }, [selectedDay, dayBookings, professionalSchedules]);

  /** Confirmar agendamento */
  const handleConfirm = async () => {
    if (!selectedDay || selectedTimes.length === 0 || selectedServices.length === 0 || !selectedProfessional) {
      return toast.error("Selecione todos os campos obrigatórios.");
    }

    try {
      const [hour, minute] = selectedTimes[0].split(":").map(Number);
      const bookingDate = setHours(setMinutes(selectedDay, minute), hour);

      await createBooking({ serviceIds: selectedServices, date: bookingDate, professionalId: selectedProfessional });

      toast.success("💈 Reserva criada com sucesso!");

      // Push para profissional/responsável (exemplo similar ao componente 1)
      try {
        const userId = session?.user && (session.user as any).id;
        if (!userId) {
        } else if (session?.user?.email !== "cliente7@gmail.com") {
          const customerName = session?.user?.name || "Cliente";
          const formattedDate = selectedDay?.toLocaleDateString("pt-BR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          const formattedTime = selectedTimes[0];

          const pushMessage = {
            title: `Novo agendamento de ${customerName}!`,
            message: `Você tem um novo agendamento com ${customerName} no dia ${formattedDate} às ${formattedTime}.`,
            userId,
          };

          const res = await fetch("/api/push/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pushMessage),
          });

          const data = await res.json();
          console.log("Resposta do servidor:", data);

          if (res.ok) {
            console.log("Push enviado com sucesso!");
          } else {
            console.log("Erro ao enviar push: " + data.error);
          }
        }
      } catch (err) {
        console.error("Erro no botão de push:", err);
        console.log("Falha ao enviar push");
      }

      // Limpar estado e fechar
      handleOpenChange(false);
      setSelectedDay(undefined);
      setSelectedTimes([]);
      setSelectedServices([]);
      setSelectedProfessional(null);
      setDayBookings([]);
      setProfessionalSchedules([]);
      setProfessionalServices([]);

      try {
        sessionStorage.setItem("showInstallAfterBooking", "1");
      } catch {}

      router.push("/?install=1");
    } catch (err) {
      console.error(err);
      toast.error("❌ Erro ao criar a reserva.");
    }
  };

  return (
    <>
      {/* Botão opcional para abrir */}
      {showTrigger && (
        <Button onClick={handleBookingClick} className="w-full md:w-auto">
          Reservar
        </Button>
      )}

      {/* Sheet controlado */}
      <Sheet open={sheetOpen} onOpenChange={handleOpenChange}>
        <SheetContent className="flex flex-col h-[100dvh] md:h-screen p-0">
          <SheetHeader className="p-4 border-b border-gray-200">
            <SheetTitle>Agendar horário</SheetTitle>
          </SheetHeader>

          {/* Conteúdo rolável */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {/* Profissional */}
            <div>
              <h3 className="font-semibold text-sm mb-2">Escolha o barbeiro</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {barbershop.professionals
                  .filter((p) => p.status === 1)
                  .map((prof) => (
                    <Button
                      key={prof.id}
                      variant={selectedProfessional === prof.id ? "default" : "outline"}
                      onClick={() => selectProfessional(prof.id)}
                      className="text-xs"
                    >
                      {prof.name}
                    </Button>
                  ))}
              </div>
            </div>

            {/* Serviços do profissional */}
            {selectedProfessional && professionalServices.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-2">Serviços disponíveis</h3>
                <div className="space-y-2">
                  {professionalServices.map((service) => (
                    <Card key={service.id} className="rounded-xl shadow-sm">
                      <CardContent className="flex justify-between items-center p-3">
                        <div>
                          <h3 className="font-semibold text-xs">{service.name}</h3>
                          <p className="text-xs text-gray-600">{service.tempo} min</p>
                          <p className="text-xs font-bold text-primary">
                            {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                              Number(service.price)
                            )}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service.id)}
                          onChange={() => toggleService(service.id)}
                          className="h-4 w-4"
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Calendário */}
            {selectedServices.length > 0 && selectedProfessional && (
              <div className="border-b border-solid py-2 w-full">
                <Calendar
                  mode="single"
                  selected={selectedDay}
                  onSelect={(date) => setSelectedDay(date ?? undefined)}
                  locale={ptBR}
                  className="w-full text-sm"
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today; // desabilita dias passados
                  }}
                />
              </div>
            )}

            {/* Horários */}
            {selectedDay && (
              <div className="py-5">
                {statusList.length === 0 ? (
                  <p className="text-center text-gray-500 font-semibold">Nenhum horário disponível para este dia.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {statusList.map(({ time, disabled }) => (
                      <Button
                        key={time}
                        variant={selectedTimes.includes(time) ? "default" : "outline"}
                        className={`rounded-full ${disabled ? "opacity-50" : ""}`}
                        onClick={() => handleTimeClick(time)}
                        disabled={disabled}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rodapé fixo */}
          <SheetFooter className="flex flex-col gap-2 border-t border-gray-200 p-4 bg-white sticky bottom-0">
            <p className="text-sm font-semibold text-black">
              Total:{" "}
              {Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(total)}
            </p>
            <SheetClose asChild>
              <Button
                onClick={handleConfirm}
                disabled={selectedServices.length === 0 || selectedTimes.length === 0 || !selectedProfessional}
                className="w-full"
              >
                Confirmar
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Dialog de login */}
      <Dialog open={signInDialogOpen} onOpenChange={setSignInDialogOpen}>
        <DialogContent>
          <DialogTitle className="sr-only">Entrar</DialogTitle>
          <SignInDialog />
        </DialogContent>
      </Dialog>
    </>
  );
}
