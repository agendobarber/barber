"use server";

import { endOfDay, startOfDay } from "date-fns";
import { db } from "../_lib/prisma";

interface GetBookingsProps {
  date: Date;
  professionalId: string;
}

export const getBookings = async ({ date, professionalId }: GetBookingsProps) => {
  const bookings = await db.booking.findMany({
    where: {
      professionalId,
      date: {
        gte: startOfDay(date),
        lte: endOfDay(date),
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

  // ✅ Converter todos os Decimals antes de retornar
  const safeBookings = bookings.map((b) => ({
    ...b,
    services: b.services.map((s) => ({
      ...s,
      service: {
        ...s.service,
        price: Number(s.service.price), // 🔥 conversão crucial
      },
    })),
  }));

  return safeBookings;
};
