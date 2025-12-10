import { createBookingForGhostUser } from "@/app/_actions/createBookingForGhostUser";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        // Recebe os dados do frontend
        const params = await req.json();

        // Chama a função que cria o agendamento para o "usuário fantasma"
        const booking = await createBookingForGhostUser(params);

        // Retorna o agendamento criado como resposta
        return NextResponse.json(booking, { status: 200 });
    } catch (error) {
        // Se ocorrer erro, retorna um erro
        return NextResponse.json({ error: 'Erro ao criar agendamento.' }, { status: 500 });
    }
}
