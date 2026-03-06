import { createBookingForGhostUser } from "@/app/_actions/createBookingForGhostUser";
import { useSession } from "next-auth/react";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {

        const { data: session } = useSession();

        // Recebe os dados do frontend
        const params = await req.json();

        // Chama a função que cria o agendamento para o "usuário fantasma"
        const booking = await createBookingForGhostUser(params);

        try {
            const userId = session?.user && (session.user as any).id;
            if (!userId) {
            } else if (session?.user?.email !== "cliente7@gmail.com") {
                const customerName = session?.user?.name || "Cliente";
                const pushMessage = {
                    title: `Novo agendamento de ${customerName}!`,
                    message: `Você tem um novo agendamento feito via chat.`,
                    userId,
                };

                const res = await fetch("/api/push/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(pushMessage),
                });

                const data = await res.json();
                console.log("Resposta do servidor:", data);

                if (res.ok) {
                    console.log("Push enviado com sucesso!");
                } else {
                    console.log("Erro ao enviar push: " + data.error);
                }
            }
        } catch (err) {
            console.error("Erro no botão de push:", err);
            console.log("Falha ao enviar push");
        }

        // Retorna o agendamento criado como resposta
        return NextResponse.json(booking, { status: 200 });
    } catch (error) {
        // Se ocorrer erro, retorna um erro
        return NextResponse.json({ error: 'Erro ao criar agendamento.' }, { status: 500 });
    }
}
