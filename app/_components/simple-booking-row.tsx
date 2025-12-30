
// app/_components/simple-booking-row.tsx
"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type RowBooking = {
  id: string;
  date: Date | string;
  status: number; // 0=cancelado, 1=confirmado, 2=finalizado (ajuste conforme seu app)
  professional: { name: string };
  barbershop: { name: string };
  total: number;
  services: { name: string; price: number }[];
};

function statusBadge(status: number) {
  if (status === 0) return { text: "Cancelado", cls: "bg-red-600 text-white" };
  if (status === 2) return { text: "Finalizado", cls: "bg-gray-700 text-white" };
  return { text: "Confirmado", cls: "bg-green-600 text-white" };
}

export default function SimpleBookingRow({ booking }: { booking: RowBooking }) {
  const badge = statusBadge(booking.status);

  const dateObj = new Date(booking.date);
  const dateStr = format(dateObj, "dd 'de' MMMM", { locale: ptBR });
  const timeStr = format(dateObj, "HH:mm", { locale: ptBR });

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      {/* Badge (status) */}
      <span
        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${badge.cls}`}
      >
        {badge.text}
      </span>

      {/* Data/Hora + Profissional/Barbearia */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">
          {dateStr} — {timeStr}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {booking.professional?.name} · {booking.barbershop?.name}
        </div>
      </div>

      {/* Total (somatório dos serviços) */}
      <div className="text-sm font-semibold text-primary whitespace-nowrap">
        {Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(booking.total)}
      </div>
    </li>
  );
}
