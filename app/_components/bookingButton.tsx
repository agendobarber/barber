"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Barbershop, BarbershopService, Professional, Booking } from "@prisma/client";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { ptBR } from "date-fns/locale";
import { setHours, setMinutes, isPast, isToday } from "date-fns";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { createBooking } from "../_actions/create-booking";
import { getBookings } from "../_actions/get-bookings";
import { useRouter } from "next/navigation";
import { Calendar } from "./ui/calendar";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetContent,
  SheetFooter,
  SheetClose,
} from "./ui/sheet";
import SignInDialog from "./sign-in-dialog";

interface BookingButtonProps {
  barbershop: Barbershop & {
    services: (Omit<BarbershopService, "price"> & { price: number })[];
    professionals: (Professional & {
      schedules?: { dayOfWeek: number; startTime: string; endTime: string }[];
    })[];
  };
}

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
          `${String(current.getHours()).padStart(2, "0")}:${String(current.getMinutes()).padStart(
            2,
            "0"
          )}`
        );
        current = new Date(current.getTime() + 30 * 60000);
      }
    }
  });

  return slots;
};

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

  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [professionalServices, setProfessionalServices] = useState<
    (Omit<BarbershopService, "price"> & { price: number })[]
  >([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date>();
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);
  const [professionalSchedules, setProfessionalSchedules] = useState<
    { dayOfWeek: number; startTime: string; endTime: string }[]
  >([]);

  const bookingsCache = useRef<{ [key: string]: Booking[] }>({});

  const handleBookingClick = () => {
    if (!data?.user) return setSignInDialogOpen(true);
    setSheetOpen(true);
  };

  const selectProfessional = async (id: string) => {
    if (selectedProfessional === id) {
      setSelectedProfessional(null);
      setProfessionalServices([]);
      setSelectedServices([]);
      setSelectedDay(undefined);
      setDayBookings([]);
      setProfessionalSchedules([]);
      return;
    }

    setSelectedProfessional(id);
    setSelectedTimes([]);
    setSelectedServices([]);

    try {
      const resSchedules = await fetch(`/api/professionals/${id}/schedules`);
      const schedules = await resSchedules.json();
      setProfessionalSchedules(schedules || []);

      const resServices = await fetch(`/api/professionals/${id}/services`);
      const services = await resServices.json();
      setProfessionalServices(services || []);
    } catch (err) {
      console.error(err);
      setProfessionalSchedules([]);
      setProfessionalServices([]);
    }

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

  useEffect(() => {
    if (!selectedDay || !selectedProfessional) return setDayBookings([]);

    const cacheKey = `${selectedProfessional}_${selectedDay.toDateString()}`;
    if (bookingsCache.current[cacheKey]) {
      setDayBookings(bookingsCache.current[cacheKey]);
      return;
    }

    let mounted = true;
    const fetchBookings = async () => {
      const bookings = await getBookings({ date: selectedDay, professionalId: selectedProfessional });
      bookingsCache.current[cacheKey] = bookings;
      if (mounted) setDayBookings(bookings);
    };
    fetchBookings();

    return () => {
      mounted = false;
    };
  }, [selectedDay, selectedProfessional]);

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const total = useMemo(
    () =>
      professionalServices
        .filter((s) => selectedServices.includes(s.id))
        .reduce((acc, s) => acc + Number(s.price), 0),
    [selectedServices, professionalServices]
  );

  const totalTempo = useMemo(
    () =>
      professionalServices
        .filter((s) => selectedServices.includes(s.id))
        .reduce((acc, s) => acc + (s.tempo || 0), 0),
    [selectedServices, professionalServices]
  );

  const roundedSlots = Math.ceil(totalTempo / 30);

  const handleTimeClick = (time: string) => {
    if (!selectedDay || !selectedProfessional || selectedServices.length === 0) {
      return toast.error("Selecione barbeiro, serviço e dia antes de escolher o horário.");
    }

    const statusList = getTimeStatusList({ bookings: dayBookings, selectedDay, professionalSchedules });
    const clicked = statusList.find((s) => s.time === time);
    if (!clicked || clicked.disabled) return toast.error("Horário indisponível.");

    const availableTimes = statusList.filter((t) => !t.disabled).map((t) => t.time);
    const startIndex = availableTimes.indexOf(time);
    const timesToSelect = availableTimes.slice(startIndex, startIndex + roundedSlots);
    if (timesToSelect.length < roundedSlots)
      return toast.error("Não há horários suficientes disponíveis.");

    setSelectedTimes(timesToSelect);
  };

  const handleConfirm = async () => {
    if (!selectedDay || selectedTimes.length === 0 || selectedServices.length === 0 || !selectedProfessional) {
      return toast.error("Selecione todos os campos obrigatórios.");
    }

    try {
      const [hour, minute] = selectedTimes[0].split(":").map(Number);
      const bookingDate = setHours(setMinutes(selectedDay, minute), hour);

      await createBooking({ serviceIds: selectedServices, date: bookingDate, professionalId: selectedProfessional });

      toast.success("💈 Reserva criada com sucesso!");
      setSheetOpen(false);
      setSelectedDay(undefined);
      setSelectedTimes([]);
      setSelectedServices([]);
      setSelectedProfessional(null);
      setDayBookings([]);
      setProfessionalSchedules([]);
      setProfessionalServices([]);
      router.push(`/`);
    } catch (err) {
      console.error(err);
      toast.error("❌ Erro ao criar a reserva.");
    }
  };

  const statusList = useMemo(() => {
    return selectedDay ? getTimeStatusList({ bookings: dayBookings, selectedDay, professionalSchedules }) : [];
  }, [selectedDay, dayBookings, professionalSchedules]);

  return (
    <>
      <Button onClick={handleBookingClick} className="w-full md:w-auto">
        Reservar
      </Button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex flex-col h-screen">
          <SheetHeader>
            <SheetTitle>Agendar horário</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-1 space-y-3">
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

            {selectedProfessional && professionalServices.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-2">Serviços disponíveis</h3>
                {professionalServices.map((service) => (
                  <Card key={service.id}>
                    <CardContent className="flex justify-between items-center p-2 h-12">
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
            )}

            {selectedServices.length > 0 && selectedProfessional && (
              <div className="border-b border-solid py-2 w-full">
                <Calendar
                  selected={selectedDay}
                  onSelect={setSelectedDay}
                  mode="single"
                  locale={ptBR}
                  className="w-full text-sm"
                />
              </div>
            )}

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
                disabled={
                  selectedServices.length === 0 || selectedTimes.length === 0 || !selectedProfessional
                }
              >
                Confirmar
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* 🔥 Dialog acessível e 100% funcional */}
      <Dialog open={signInDialogOpen} onOpenChange={setSignInDialogOpen}>
        <DialogContent>
          <DialogTitle className="sr-only">Entrar</DialogTitle>
          <SignInDialog />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingButton;
