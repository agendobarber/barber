"use client";

import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface BookingService {
  name: string;
  price: number;
  status: number;
}

interface BookingGroup {
  key?: string;
  ids: string[];
  date: Date | string;
  barbershop: { id: string; name: string; imageUrl: string };
  professional?: { name: string };
  services: BookingService[];
  user?: { name?: string };
  status?: number; // opcional para status geral
}

interface BookingItemProps {
  bookingGroup: BookingGroup;
  isBarber?: boolean;
}

const BookingItem = ({ bookingGroup, isBarber = false }: BookingItemProps) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { ids = [], barbershop, professional, services = [], date, user } =
    bookingGroup;

  if (!Array.isArray(services) || services.length === 0) return null;

  const bookingDate = new Date(date);

  const getBookingStatus = (status: number, date: Date) => {
    if (status === 0) return "Cancelado";
    if (status === 1 && date > new Date()) return "Confirmado";
    if (status === 1 && date <= new Date()) return "Finalizado";
    return "";
  };

  const bookingStatusText = getBookingStatus(
    bookingGroup.status ?? services[0].status,
    bookingDate
  );

  const getBadgeVariant = (status: number, date: Date) => {
    if (status === 0) return "destructive";
    if (status === 1 && date > new Date()) return "default";
    if (status === 1 && date <= new Date()) return "secondary";
    return "default";
  };

  const totalPrice = services.reduce((acc, s) => acc + s.price, 0);

  const handleCancelBooking = async () => {
    const safeIds = Array.isArray(ids) ? ids : [];
    if (safeIds.length === 0) {
      toast.error("Nenhum agendamento encontrado para cancelar.");
      return;
    }

    const confirmCancel = confirm(
      `Tem certeza que deseja cancelar ${
        safeIds.length > 1 ? "todos os agendamentos" : "este agendamento"
      }?`
    );
    if (!confirmCancel) return;

    try {
      setIsCancelling(true);
      const res = await fetch(`/api/bookings/cancel-group`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: safeIds }),
      });

      if (!res.ok) throw new Error("Erro ao cancelar agendamento");

      toast.success(
        `${safeIds.length > 1 ? "Agendamentos" : "Agendamento"} cancelado${
          safeIds.length > 1 ? "s" : ""
        } com sucesso!`
      );

       const pushMessage = {
          title: `Cancelamento!`,
          message: `Cancelamento111`,
          userId: 222,
        };

        const res2 = await fetch("/api/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pushMessage),
        });

        const data = await res2.json();
        console.log("Resposta do servidor:", data);

        if (res2.ok) {
          console.log("Push enviado com sucesso!");
        } else {
          console.log("Erro ao enviar push: " + data.error);
        }

      setIsSheetOpen(false);
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível cancelar o(s) agendamento(s).");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger className="w-[210px]">
        <Card className="w-[200px] h-[250px] flex-shrink-0">
          <CardContent className="flex flex-col justify-between px-3 py-2 gap-1">
            <Badge
              className="w-fit text-xs px-2 py-0.5"
              variant={getBadgeVariant(
                bookingGroup.status ?? services[0].status,
                bookingDate
              )}
            >
              {bookingStatusText}
            </Badge>

            {/* Profissional */}
            <p className="text-xs text-gray-400 italic mt-1">
              Profissional: {professional?.name ?? "Não informado"}
            </p>

            <div className="flex items-center gap-2 mt-auto">
              {isBarber ? (
                <p className="text-xs md:text-sm text-gray-300">
                  {user?.name ?? "Cliente desconhecido"}
                </p>
              ) : (
                <p className="text-xs md:text-sm text-gray-300">
                  {barbershop.name}
                </p>
              )}
            </div>

            <div className="flex flex-col items-center justify-center border-t mt-2 pt-1">
              <p className="text-xs md:text-sm text-gray-400">
                {format(bookingDate, "MMMM", { locale: ptBR })}
              </p>
              <p className="text-lg md:text-xl font-bold leading-none">
                {format(bookingDate, "dd", { locale: ptBR })}
              </p>
              <p className="text-xs md:text-sm">
                {format(bookingDate, "HH:mm", { locale: ptBR })}
              </p>
            </div>
          </CardContent>
        </Card>
      </SheetTrigger>

      <SheetContent className="w-[90%]">
        <SheetHeader>
          <SheetTitle>Informações da Reserva</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <Badge
            className="w-fit"
            variant={getBadgeVariant(
              bookingGroup.status ?? services[0].status,
              bookingDate
            )}
          >
            {bookingStatusText}
          </Badge>

          <Card className="mt-3 mb-6">
            <CardContent className="p-3 space-y-3">
              {services.map((service, index) => (
                <div key={index} className="flex justify-between items-center">
                  <h2 className="font-bold">{service.name}</h2>
                  <p className="text-sm font-bold text-primary">
                    {Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(Number(service.price))}
                  </p>
                </div>
              ))}

              {/* Total */}
              <div className="flex justify-between items-center border-t pt-2">
                <h2 className="font-bold">Total</h2>
                <p className="text-sm font-bold text-primary">
                  {Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalPrice)}
                </p>
              </div>

              <div className="flex justify-between items-center">
                <h2 className="text-sm text-gray-400">Profissional</h2>
                <p className="text-sm text-primary">
                  {professional?.name ?? "Não informado"}
                </p>
              </div>

              <div className="flex justify-between items-center">
                <h2 className="text-sm text-gray-400">Data</h2>
                <p className="text-sm text-primary">
                  {format(bookingDate, "d 'de' MMMM", { locale: ptBR })}
                </p>
              </div>

              <div className="flex justify-between items-center">
                <h2 className="text-sm text-gray-400">Horário</h2>
                <p className="text-sm text-primary">
                  {format(bookingDate, "HH:mm", { locale: ptBR })}
                </p>
              </div>

              <div className="flex justify-between items-center">
                <h2 className="text-sm text-gray-400">
                  {isBarber ? "Cliente" : "Barbearia"}
                </h2>
                <p className="text-sm text-primary">
                  {isBarber
                    ? user?.name ?? "Cliente não identificado"
                    : barbershop.name}
                </p>
              </div>
            </CardContent>
          </Card>

          {bookingGroup.status === 1 && bookingDate > new Date() && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleCancelBooking}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelando..." : "Cancelar agendamento"}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BookingItem;
