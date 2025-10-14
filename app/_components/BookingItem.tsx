"use client";

import React from "react";
import Image from "next/image";

type Barbershop = { id: string; name: string; imageUrl?: string | null };
type Service = { id: string; name: string; price?: number | string };
type BookingService = { id: string; service: Service & { barbershop: Barbershop } };
type Booking = { id: string; date: string | Date; services: BookingService[] };

interface BookingItemProps {
  booking?: Booking;
}

const BookingItem = ({ booking }: BookingItemProps) => {
  if (!booking || booking.services.length === 0) return null;

  const firstService = booking.services[0];
  const barbershop = firstService.service.barbershop;
  const services = booking.services.map((b) => b.service);
  const bookingDate = new Date(booking.date);
  const total = services.reduce((acc, s) => acc + Number(s.price ?? 0), 0);

  return (
    <div className="min-w-[250px] bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 relative rounded-lg overflow-hidden bg-gray-100">
          {barbershop?.imageUrl ? (
            <Image src={barbershop.imageUrl} alt={barbershop.name} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-gray-500">
              Sem imagem
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm">{barbershop?.name ?? "—"}</div>
          <div className="text-xs text-gray-500">{bookingDate.toLocaleString("pt-BR")}</div>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        {services.map((s) => (
          <div key={s.id} className="flex justify-between text-sm">
            <div className="truncate">{s.name}</div>
            <div className="font-medium">
              R$ {Number(s.price ?? 0).toFixed(2).replace(".", ",")}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <div className="text-sm text-gray-500">Total</div>
        <div className="font-bold">R$ {total.toFixed(2).replace(".", ",")}</div>
      </div>
    </div>
  );
};

export default BookingItem;
