"use server";

import { revalidatePath } from "next/cache";
import { db } from "../_lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../_lib/auth";
import { addMinutes } from "date-fns";

interface CreateBookingParams {
  serviceIds: string[];
  professionalId: string;
  date: Date;
}

export const createBooking = async (params: CreateBookingParams) => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Usuário não autenticado.");
  }

  // 🔹 Busca os serviços selecionados pra calcular o tempo total
  const services = await db.barbershopService.findMany({
    where: { id: { in: params.serviceIds } },
    select: { tempo: true },
  });

  const totalTempo = services.reduce((sum, s) => sum + (s.tempo || 0), 0);

  // 🔹 Arredonda o total pra múltiplos de 30 minutos pra cima
  const roundedMinutes = Math.ceil(totalTempo / 30) * 30;

  // 🔹 Calcula horário de término
  const endDate = addMinutes(params.date, roundedMinutes);

  // 🔹 Cria o booking
  const booking = await db.booking.create({
    data: {
      userId: (session.user as any).id,
      professionalId: params.professionalId,
      date: params.date,
      endDate,
      services: {
        create: params.serviceIds.map((id) => ({
          service: { connect: { id } },
        })),
      },
    },
    include: {
      services: { include: { service: true } },
    },
  });

  // ✅ Converte Decimal → number
  const safeBooking = {
    ...booking,
    services: booking.services.map((s) => ({
      ...s,
      service: {
        ...s.service,
        price: Number(s.service.price),
      },
    })),
  };

  revalidatePath("/barbershops/[id]");
  return safeBooking;
};
