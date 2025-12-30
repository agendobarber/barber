
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

type BookingItemProps = {
  bookingGroup: any;
  isBarber?: boolean;
  /** Controlado pelo pai (opcional). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Se true, renderiza o Card (Trigger). Se false, não renderiza Trigger. */
  showCardTrigger?: boolean;
};

const BookingItem = ({
  bookingGroup,
  isBarber = false,
  open,
  onOpenChange,
  showCardTrigger = true,
}: BookingItemProps) => {
  // ---------- CONTROLE DE ABERTURA ----------
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof open === "boolean";
  const isSheetOpen = isControlled ? (open as boolean) : internalOpen;
  const handleOpenChange = (next: boolean) => {
    if (isControlled) {
      onOpenChange?.(next);
    } else {
      setInternalOpen(next);
    }
  };
  // -----------------------------------------

  const [isCancelling, setIsCancelling] = useState(false);
  const { ids = [], barbershop, professional, services = [], date, user } =
    bookingGroup;

  console.log("Inicio do componente web1.");

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
    // Você pode ajustar variantes conforme sua paleta (default, secondary, destructive).
  };

  const totalPrice = services.reduce((acc, s) => acc + s.price, 0);

  const handleCancelBooking = async () => {
    const safeIds = Array.isArray(ids) ? ids : [];
    if (safeIds.length === 0) {
      toast.error("Nenhum agendamento encontrado para cancelar.");
      return;
    }

    const confirmCancel = confirm(
      `Tem certeza que deseja cancelar ${safeIds.length > 1 ? "todos os agendamentos" : "este agendamento"
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
        `${safeIds.length > 1 ? "Agendamentos" : "Agendamento"} cancelado${safeIds.length > 1 ? "s" : ""
        } com sucesso!`
      );

      handleOpenChange(false);
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível cancelar o(s) agendamento(s).");
    } finally {
      setIsCancelling(false);
    }
  };

  const statusVariant = getBadgeVariant(bookingGroup.status ?? services?.[0]?.status, bookingDate);


  return (
    <Sheet open={isSheetOpen} onOpenChange={handleOpenChange}>
      {showCardTrigger ? (
        <SheetTrigger className="w-[210px]">
          {/* Card-resumo */}
          <Card className="w-[200px] h-[250px] flex-shrink-0 relative">
            {/* Badge sobreposto DENTRO do card */}
            <div className="absolute top-2 left-2">
              <Badge className="text-xs px-2 py-0.5" variant={statusVariant}>
                {bookingStatusText}
              </Badge>
            </div>

            <CardContent className="flex flex-col justify-between px-3 py-2 gap-1">
              {/* Profissional */}
              <p className="text-xs text-gray-400 italic mt-6">
                {/* mt-6 para dar espaço abaixo do badge */}
                Profissional: {professional?.name ?? "Não informado"}
              </p>

              <div className="flex items-center gap-2 mt-auto">
                {isBarber ? (
                  <p className="text-xs md:text-sm text-gray-300">
                    {user?.name ?? "Cliente desconhecido"}
                  </p>
                ) : (
                  <p className="text-xs md:text-sm text-gray-300">{barbershop.name}</p>
                )}
              </div>

              {/* Data compacta */}
              <div className="flex flex-col items-center justify-center border-t mt-2 pt-1">
                <p className="text-xs md:text-sm text-gray-400">
                  {format(bookingDate, "MMMM", { locale: ptBR })}
                </p>
                <p className="text-lg md:text-xl font-bold leading-none">
                  {format(bookingDate, "dd", { locale: ptBR })}
                </p>
                <p className="text-xs md:text-sm">{format(bookingDate, "HH:mm", { locale: ptBR })}</p>
              </div>
            </CardContent>
          </Card>
        </SheetTrigger>
      ) : null}

      {/* SheetContent: não mexemos na largura do drawer; 
          limitamos o conteúdo interno para ficar estreito */}
      <SheetContent className="w-[90%] px-4 md:px-6">
        <SheetHeader>
          <SheetTitle>Informações da Reserva</SheetTitle>
        </SheetHeader>

        {/* CONTAINER INTERNO COM LARGURA MÁXIMA E CENTRALIZADO */}
        <div className="mt-6 mx-auto max-w-[440px] space-y-4">
          {/* Card detalhado; badge DENTRO dele */}
          <Card className="shadow-sm border rounded-xl relative">
            {/* Badge sobreposto DENTRO do card */}
            <div className="absolute top-3 left-3">
              <Badge className="text-xs px-2 py-0.5" variant={statusVariant}>
                {bookingStatusText}
              </Badge>
            </div>

            <CardContent className="p-4 space-y-3">
              {/* Espaço extra para não colidir com o badge */}
              <div className="h-3" />

              {/* Lista de serviços */}
              <div className="space-y-2">
                {services.map((service, index) => (
                  <div key={index} className="flex items-center justify-between gap-4">
                    <h2 className="font-semibold">{service.name}</h2>
                    {/* Coluna direita com largura mínima e alinhada à direita */}
                    <p className="text-sm font-bold text-primary min-w-[96px] text-right">
                      {Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(Number(service.price))}
                    </p>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t pt-3 flex items-center justify-between gap-4">
                <h2 className="font-bold">Total</h2>
                <p className="text-sm font-bold text-primary min-w-[96px] text-right">
                  {Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalPrice)}
                </p>
              </div>

              {/* Metadados */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-sm text-muted-foreground">Profissional</h2>
                  <p className="text-sm text-primary min-w-[140px] text-right">
                    {professional?.name ?? "Não informado"}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-sm text-muted-foreground">Data</h2>
                  <p className="text-sm text-primary min-w-[140px] text-right">
                    {format(bookingDate, "d 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-sm text-muted-foreground">Horário</h2>
                  <p className="text-sm text-primary min-w-[140px] text-right">
                    {format(bookingDate, "HH:mm", { locale: ptBR })}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-sm text-muted-foreground">{isBarber ? "Cliente" : "Barbearia"}</h2>
                  <p className="text-sm text-primary min-w-[140px] text-right">
                    {isBarber ? user?.name ?? "Cliente não identificado" : barbershop.name}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ação de cancelar */}

          {bookingGroup.status === 1 && bookingDate > new Date() && handleCancelBooking ? (
            <Button
              onClick={handleCancelBooking}
              disabled={isCancelling}
              className="
      w-full 
      bg-red-600 
      hover:bg-red-700 
      text-white 
      font-semibold 
      py-3 
      rounded-lg 
      transition
      disabled:opacity-60 
      disabled:cursor-not-allowed
    "
            >
              {isCancelling ? "Cancelando..." : "Cancelar agendamento"}
            </Button>
          ) : null}

        </div>
      </SheetContent>
    </Sheet>
  );
}



export default BookingItem;
