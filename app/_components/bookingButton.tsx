"use client";

import { useState, useEffect } from "react";
import { Barbershop, BarbershopService, Professional, Booking } from "@prisma/client";
import { Button } from "./ui/button";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "./ui/sheet";
import { Card, CardContent } from "./ui/card";
import { Calendar } from "./ui/calendar";
import { ptBR } from "date-fns/locale";
import { setHours, setMinutes, isPast, isToday } from "date-fns";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { createBooking } from "../_actions/create-booking";
import { getBookings } from "../_actions/get-bookings";
import { Dialog, DialogContent } from "./ui/dialog";
import SignInDialog from "./sign-in-dialog";
import { useRouter } from "next/navigation";

interface BookingButtonProps {
  barbershop: Barbershop & {
    services: (Omit<BarbershopService, "price"> & { price: number })[];
    professionals: (Professional & { schedules?: { dayOfWeek: number; startTime: string; endTime: string }[] })[];
  };
}

// Gera horários do profissional conforme início e fim do dia
const generateProfessionalTimeSlots = (
  schedules: { dayOfWeek: number; startTime: string; endTime: string }[],
  selectedDay: Date
): string[] => {
  const dayOfWeek = selectedDay.getDay();
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
        current = new Date(current.getTime() + 30 * 60000); // incrementa 30 min
      }
    }
  });

  return slots;
};

// Função que verifica status de cada horário
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

const BookingButton = ({ barbershop }: BookingButtonProps) => {
  const { data } = useSession();
  const router = useRouter();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [signInDialogOpen, setSignInDialogOpen] = useState(false);

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date>();
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);
  const [professionalSchedules, setProfessionalSchedules] = useState<{ dayOfWeek: number; startTime: string; endTime: string }[]>([]);

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const selectProfessional = async (id: string) => {
    if (selectedProfessional === id) return setSelectedProfessional(null);

    setSelectedProfessional(id);
    setSelectedTimes([]);

    // Pega horários do profissional via API
    try {
      const res = await fetch(`/api/professionals/${id}/schedules`);
      const schedules = await res.json();
      setProfessionalSchedules(schedules || []);
    } catch (err) {
      console.error(err);
      setProfessionalSchedules([]);
    }

    if (!selectedDay) return setDayBookings([]);

    // Pega bookings do dia
    const bookings = await getBookings({ date: selectedDay, professionalId: id });
    setDayBookings(bookings);
  };

  useEffect(() => {
    if (!selectedDay || !selectedProfessional) {
      setDayBookings([]);
      return;
    }

    let mounted = true;
    const fetchBookings = async () => {
      const bookings = await getBookings({ date: selectedDay, professionalId: selectedProfessional });
      if (mounted) setDayBookings(bookings);
    };
    fetchBookings();

    return () => { mounted = false; };
  }, [selectedDay, selectedProfessional]);

  const total = barbershop.services
    .filter((s) => selectedServices.includes(s.id))
    .reduce((acc, s) => acc + Number(s.price), 0);

  const totalTempo = barbershop.services
    .filter((s) => selectedServices.includes(s.id))
    .reduce((acc, s) => acc + (s.tempo || 0), 0);

  const roundedSlots = Math.ceil(totalTempo / 30);

  const handleBookingClick = () => {
    if (!data?.user) return setSignInDialogOpen(true);
    setSheetOpen(true);
  };

  const handleTimeClick = (time: string) => {
    if (!selectedDay || !selectedProfessional || selectedServices.length === 0) {
      toast.error("Selecione serviço, barbeiro e dia antes de escolher o horário.");
      return;
    }

    const statusList = getTimeStatusList({ bookings: dayBookings, selectedDay, professionalSchedules });
    const clicked = statusList.find((s) => s.time === time);
    if (!clicked || clicked.disabled) {
      toast.error("Horário indisponível. Escolha outro horário.");
      return;
    }

    const availableTimes = statusList.filter((t) => !t.disabled).map((t) => t.time);
    const startIndex = availableTimes.indexOf(time);
    const timesToSelect = availableTimes.slice(startIndex, startIndex + roundedSlots);
    if (timesToSelect.length < roundedSlots) {
      toast.error("Não há horários suficientes disponíveis para o tempo total dos serviços.");
      return;
    }

    setSelectedTimes(timesToSelect);
  };

  const handleConfirm = async () => {
    if (!selectedDay || selectedTimes.length === 0 || selectedServices.length === 0 || !selectedProfessional) {
      toast.error("Selecione todos os campos obrigatórios.");
      return;
    }

    try {
      const [hour, minute] = selectedTimes[0].split(":").map(Number);
      const bookingDate = setHours(setMinutes(selectedDay, minute), hour);

      await createBooking({
        serviceIds: selectedServices,
        date: bookingDate,
        professionalId: selectedProfessional,
      });

      toast.success("💈 Reserva criada com sucesso!");
      setSheetOpen(false);
      setSelectedDay(undefined);
      setSelectedTimes([]);
      setSelectedServices([]);
      setSelectedProfessional(null);
      setDayBookings([]);
      setProfessionalSchedules([]);

      router.push(`/`);
    } catch (err) {
      console.error(err);
      toast.error("❌ Erro ao criar a reserva.");
    }
  };

  const statusList = selectedDay
    ? getTimeStatusList({ bookings: dayBookings, selectedDay, professionalSchedules })
    : [];

  return (
    <>
      <Button onClick={handleBookingClick} className="w-full md:w-auto">Reservar</Button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex flex-col h-screen">
          <SheetHeader><SheetTitle>Agendar horário</SheetTitle></SheetHeader>

          <div className="flex-1 overflow-y-auto px-1 space-y-3">
            {/* Serviços */}
            <div>
              <h3 className="font-semibold text-sm mb-2">Escolha os serviços</h3>
              {barbershop.services.map((service) => (
                <Card key={service.id}>
                  <CardContent className="flex justify-between items-center p-2 h-12">
                    <div>
                      <h3 className="font-semibold text-xs">{service.name}</h3>
                      <p className="text-xs text-gray-600">{service.tempo} min</p>
                      <p className="text-xs font-bold text-primary">
                        {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(service.price))}
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

            {/* Profissional */}
            {selectedServices.length > 0 && (
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
            )}

            {/* Calendário */}
            {selectedProfessional && (
              <div className="border-b border-solid py-2 w-full">
                <Calendar
                  selected={selectedDay}
                  onSelect={setSelectedDay}
                  mode="single"
                  locale={ptBR}
                  hidden={{ before: new Date() }}
                  className="w-full text-sm"
                />
              </div>
            )}

            {/* Horários */}
            {selectedDay && (
              <div className="px-5 py-5">
                {statusList.length === 0 ? (
                  <p className="text-center text-gray-500 font-semibold">
                    Nenhum horário disponível para este dia.
                  </p>
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

          <SheetFooter className="flex flex-col gap-2 border-t border-gray-200 p-2">
            <p className="text-sm font-bold text-primary">
              Total:{" "}
              {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(total)}
            </p>
            <SheetClose asChild>
              <Button
                onClick={handleConfirm}
                disabled={selectedServices.length === 0 || selectedTimes.length === 0 || !selectedProfessional}
              >
                Confirmar
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={signInDialogOpen} onOpenChange={setSignInDialogOpen}>
        <DialogContent>
          <SignInDialog />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingButton;
