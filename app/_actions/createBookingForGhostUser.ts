"use server";

import { db } from "../_lib/prisma";
import { addMinutes } from "date-fns";

interface CreateBookingParams {
    userId: string; // ID real do usuário
    serviceIds: string[];
    professionalId: string;
    date: Date;
}

export const createBookingForGhostUser = async (params: CreateBookingParams) => {
    try {
        console.log("Iniciando criação de booking...");

        // Verifica se o userId foi fornecido
        if (!params.userId) {
            throw new Error("userId não definido. Crie ou obtenha o usuário antes de agendar.");
        }

        // Busca os serviços selecionados para calcular o tempo total
        const services = await db.barbershopService.findMany({
            where: { id: { in: params.serviceIds } },
            select: { tempo: true, price: true },
        });

        if (!services || services.length === 0) {
            throw new Error("Nenhum serviço encontrado para os IDs fornecidos.");
        }

        // Calcula o tempo total dos serviços
        const totalTempo = services.reduce((sum, s) => sum + (s.tempo || 0), 0);

        // Arredonda o total para múltiplos de 30 minutos
        const roundedMinutes = Math.ceil(totalTempo / 30) * 30;

        // Calcula o horário de término
        const endDate = addMinutes(params.date, roundedMinutes);

        // Cria o agendamento para o usuário real
        const booking = await db.booking.create({
            data: {
                userId: params.userId,
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

        // Converte Decimal → number para segurança
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

        console.log("Agendamento criado com sucesso:", safeBooking);

        return safeBooking;
    } catch (error) {
        console.error("Erro ao criar o agendamento:", error);
        throw new Error(`Erro ao criar o agendamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
};
