import React from "react";
import BookingItem from "../_components/BookingItem";
import { db } from "../_lib/prisma";

// 👇 força renderização dinâmica (SSR em runtime, não no build)
export const dynamic = "force-dynamic";

const BookingsPage = async () => {
  let bookings = [];

  try {
    // Busca os bookings com os serviços e barbearias
    const bookingsRaw = await db.booking.findMany({
      include: {
        services: { include: { service: { include: { barbershop: true } } } },
      },
    });

    // Converte valores Decimal para number
    bookings = bookingsRaw.map((b) => ({
      ...b,
      services: b.services.map((bs) => ({
        ...bs,
        service: {
          ...bs.service,
          price: bs.service.price ? Number(bs.service.price) : undefined,
        },
      })),
    }));
  } catch (error) {
    console.error("❌ Erro ao buscar bookings:", error);
    // Retorna um fallback simples se o banco não estiver acessível
    return (
      <div className="p-5 max-w-5xl mx-auto">
        <h1 className="text-xl font-bold mb-5">Meus Agendamentos</h1>
        <p className="text-gray-500">Não foi possível carregar seus agendamentos.</p>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-5">Meus Agendamentos</h1>
      <div className="space-y-4">
        {bookings.length > 0 ? (
          bookings.map((b) => <BookingItem key={b.id} booking={b} />)
        ) : (
          <p className="text-gray-500">Nenhum agendamento encontrado.</p>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;
