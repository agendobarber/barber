import React from "react";
import BookingItem from "../_components/BookingItem";
import { db } from "../_lib/prisma";

const BookingsPage = async () => {
  // Busca os bookings com os serviços e barbearias
  const bookingsRaw = await db.booking.findMany({
    include: {
      services: { include: { service: { include: { barbershop: true } } } },
    },
  });

  // Mapear para converter Decimal para number
  const bookings = bookingsRaw.map((b) => ({
    ...b,
    services: b.services.map((bs) => ({
      ...bs,
      service: {
        ...bs.service,
        price: bs.service.price ? Number(bs.service.price) : undefined,
      },
    })),
  }));

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-5">Meus Agendamentos</h1>
      <div className="space-y-4">
        {bookings.map((b) => (
          <BookingItem key={b.id} booking={b} />
        ))}
      </div>
    </div>
  );
};

export default BookingsPage;
