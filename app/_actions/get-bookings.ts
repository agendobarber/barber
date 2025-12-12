"use server";

import { endOfDay, startOfDay } from "date-fns";
import { db } from "../_lib/prisma";

interface GetBookingsProps {
  date: Date;
  professionalId: string;
}

export const getBookings = async ({ date, professionalId }: GetBookingsProps) => {
  const start = startOfDay(date);
  const end = endOfDay(date);

  const bookings = await db.booking.findMany({
    where: {
      professionalId,
      date: {
        gte: start,  // Início do dia
        lte: end,    // Fim do dia
      },
      status: 1,
    },
    include: {
      services: {
        include: { service: true },
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  const safeBookings = bookings.map((b) => ({
    ...b,
    services: b.services.map((s) => ({
      ...s,
      service: {
        ...s.service,
        price: Number(s.service.price),
      },
    })),
  }));

  return safeBookings;
};
