"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { Button } from "../_components/ui/button";
import { Calendar } from "../_components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { setHours, setMinutes, isPast, isToday } from "date-fns";
import { getBarbershopId } from "../_actions/get-barbershop-id";

// ---------------------- TIPOS ----------------------
type Step =
    | "start"
    | "menu"
    | "askName"
    | "askPhone"
    | "askService"
    | "confirmServices"
    | "askProfessional"
    | "askDate"
    | "askHour"
    | "confirmBooking"
    | "finished"
    | "askPhoneForConsult";

// Gera time slots de 30min
const generateProfessionalTimeSlots = (
    schedules: { dayOfWeek: number; startTime: string; endTime: string }[],
    selectedDay: Date
): string[] => {
    const dayOfWeek = selectedDay.getDay();
    const slots: string[] = [];

    schedules.forEach((s) => {
        if (s.dayOfWeek === dayOfWeek) {
            const [startHour, startMin] = s.startTime.split(":").map(Number);
            const [endHour, endMin] = s.endTime.split(":").map(Number);

            let current = setHours(setMinutes(new Date(selectedDay), startMin), startHour);
            const endTime = setHours(setMinutes(new Date(selectedDay), endMin), endHour);

            while (current < endTime) {
                slots.push(
                    `${String(current.getHours()).padStart(2, "0")}:${String(
                        current.getMinutes()
                    ).padStart(2, "0")}`
                );
                current = new Date(current.getTime() + 30 * 60000);
            }
        }
    });

    return slots;
};

// verifica horários ocupados
const getTimeStatusList = ({
    professionalSchedules,
    bookings,
    selectedDay,
}: {
    professionalSchedules: { dayOfWeek: number; startTime: string; endTime: string }[];
    bookings: any[];
    selectedDay: Date;
}) => {
    const availableSlots = generateProfessionalTimeSlots(professionalSchedules, selectedDay);

    console.log("getTimeStatusList1");
    console.log(availableSlots);

    return availableSlots.map((time) => {
        const [hour, minute] = time.split(":").map(Number);
        const current = setHours(setMinutes(new Date(selectedDay), minute), hour);

        const timeInPast = isPast(current) && isToday(selectedDay);
        const isBooked = bookings.some((b) => {
            const start = new Date(b.date);
            const end = new Date(b.endDate);
            return current >= start && current < end;
        });

        return { time, disabled: timeInPast || isBooked };
    });
};

// ============================================================
export default function ChatPage() {
    const [services, setServices] = useState<any[]>([]);
    const [professionals, setProfessionals] = useState<any[]>([]);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [selectedProfessional, setSelectedProfessional] = useState<string>("");

    const [professionalSchedules, setProfessionalSchedules] = useState<any[]>([]);
    const [dayBookings, setDayBookings] = useState<any[]>([]);
    const [selectedDay, setSelectedDay] = useState<Date | undefined>();
    const [selectedHour, setSelectedHour] = useState<string>("");
    const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);

    const [selectedContiguousSlots, setSelectedContiguousSlots] = useState<string[]>([]);

    const [messages, setMessages] = useState([
        {
            id: Date.now(),
            sender: "bot",
            text:
                "Olá! 👋 Sou o Sr. Corte.\n" +
                "Como posso ajudar hoje?\n\n" +
                "1️⃣ Agendar horário\n" +
                "2️⃣ Consultar meus horários\n",
        },
    ]);

    const [BARBERSHOP_ID, setBarbershopId] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const id = await getBarbershopId();
            setBarbershopId(id);
        })();
    }, []);


    const bottomRef = useRef<HTMLDivElement>(null);
    const [input, setInput] = useState("");

    const [step, setStep] = useState<Step>("menu");

    const [booking, setBooking] = useState<{
        name: string;
        phone: string;
        professional: string;
        date: string;
        hour: string;
        userId?: string;
    }>({
        name: "",
        phone: "",
        professional: "",
        date: "",
        hour: "",
        userId: "",
    });

    useEffect(() => {
        if (booking.userId) {
            console.log("userId atualizado:", booking.userId);

            // Agora você pode prosseguir com o fluxo
            nextStep("askService");
            loadServices();
        }
    }, [booking.userId]);  // Este efeito só vai ser disparado quando userId for atualizado.


    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const botSay = (text: string) => {
        setMessages((prev) => [
            ...prev,
            { id: Date.now() + Math.random(), sender: "bot", text },
        ]);
    };

    const nextStep = (s: Step) => setStep(s);

    // 🔵 CARREGA SERVIÇOS
    const loadServices = async () => {
        const res = await fetch(`/api/barbershop/${BARBERSHOP_ID}/services`);
        const data = await res.json();
        setServices(data);
        botSay("Perfeito! Selecione abaixo os serviços desejados:");
    };

    // 🔴 CARREGA PROFISSIONAIS
    const loadProfessionals = async () => {
        const res = await fetch(
            `/api/barbershop/${BARBERSHOP_ID}/professionals-by-service`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    servicesIds: selectedServices,
                    match: "all",
                }),
            }
        );

        const data = await res.json();
        setProfessionals(data);

        if (data.length === 0) {
            botSay("⚠️ Nenhum profissional faz todos os serviços selecionados.");
            return;
        }

        botSay("Perfeito! Escolha abaixo o profissional:");
        nextStep("askProfessional");
    };

    const createOrGetChatUser = async (name: string, phone: string) => {
        const res = await fetch("/api/chat/create-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, phone }),
        });

        const data = await res.json();
        console.log("data", data);

        if (data.user && data.user.id) {
            console.log("data.user.id", data.user.id);

            // Atualiza o estado com o userId
            setBooking((b) => ({
                ...b,
                userId: data.user.id, // Atualiza o userId corretamente
            }));
        } else {
            // Caso não consiga criar o usuário
            botSay("Erro ao criar seu usuário. Tente novamente.");
        }
    };

    const loadDayBookings = async (day: Date, professionalId: string) => {
        // Formatar a data para ISO string para a query string
        const dateParam = day.toISOString();

        // Fazer a requisição para a API com GET
        const res = await fetch(`/api/bookings/by-day?date=${dateParam}&professionalId=${professionalId}`, {
            method: "GET", // Usando GET agora
            headers: {
                "Content-Type": "application/json", // Cabeçalho para JSON
            },
        });

        console.log("agendamentos");

        // Verificar se a resposta foi bem-sucedida
        if (res.ok) {
            const data = await res.json(); // Parse da resposta JSON
            console.log(data);
            setDayBookings(data || []); // Atualizar estado com os dados ou lista vazia
        } else {
            console.error("Erro ao buscar agendamentos.");
            setDayBookings([]); // Caso haja erro, atualizar estado com lista vazia
        }
    };



    const statusList = useMemo(() => {
        if (!selectedDay) return [];
        return getTimeStatusList({
            professionalSchedules,
            bookings: dayBookings,
            selectedDay,
        });
    }, [selectedDay, dayBookings, professionalSchedules]);

    const totalTempo = useMemo(() => {
        return services
            .filter((s) => selectedServices.includes(s.id))
            .reduce((acc, s) => acc + (s.tempo || 0), 0);
    }, [selectedServices, services]);

    const roundedSlots = Math.max(1, Math.ceil(totalTempo / 30));

    // -------------------- LÓGICA DO MENU INICIAL --------------------
    const handleMenuSelection = (text: string) => {
        const option = text.trim();

        if (option === "1") {
            botSay("Ótimo! Vamos começar seu agendamento. Qual o seu nome?");
            nextStep("askName");
            return;
        }

        if (option === "2") {
            botSay("Claro! Para consultar seus horários, informe seu WhatsApp:");
            nextStep("askPhoneForConsult");
            return;
        }


        botSay("❗ Escolha uma opção válida:\n1️⃣ Agendar horário\n2️⃣ Consultar meus horários");
    };

    // -------------------- LÓGICA CHAT --------------------
    const handleUserReply = async (text: string) => {
        // MENU PRINCIPAL
        if (step === "menu") {
            handleMenuSelection(text);
            return;
        }

        switch (step) {
            case "askName":
                setBooking((b) => ({ ...b, name: text }));
                botSay(`Prazer, ${text}! Me passa seu WhatsApp?`);
                nextStep("askPhone");
                break;

            case "askPhone":
                setBooking((b) => ({ ...b, phone: text }));
                botSay("Certo! Vou listar os serviços…");

                await createOrGetChatUser(booking.name, text);

                /*console.log("fora do if");
                console.log(booking); // Esse log ainda pode não refletir a mudança do estado imediatamente.

                if (!booking.userId) {
                    console.log("dentro do if");
                    console.log(booking); // Verifique se o userId já está definido aqui.

                    botSay("Erro ao obter seu ID de usuário. Tente novamente.");
                    nextStep("menu");
                    return;
                }

                nextStep("askService");
                loadServices();*/
                break;
            case "confirmBooking":

                // Para prod
                /*botSay("Agendado com sucesso! ✂️\n\nDigite *menu* para voltar ao início.");
                nextStep("finished");
                return;*/

                if (text.toLowerCase() === "sim") {
                    if (!booking.userId) {
                        botSay("Erro ao encontrar seu ID de usuário. Tente novamente.");
                        nextStep("menu");
                        return;
                    }

                    console.log("booking.date");
                    console.log(booking.date);

                    try {
                        const response = await fetch("/api/bookings", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                userId: booking.userId,
                                professionalId: booking.professional,
                                date: booking.date,
                                serviceIds: selectedServices,
                            }),
                        });

                        const data = await response.json();

                        if (response.ok) {
                            botSay("Agendado com sucesso! ✂️\n\nDigite *menu* para voltar ao início.");
                            nextStep("finished");
                        } else {
                            botSay("Desculpe, ocorreu um erro ao agendar seu horário. Tente novamente.");
                            nextStep("menu");
                        }
                    } catch (error) {
                        console.error(error);
                        botSay("Houve um erro ao tentar agendar. Tente novamente mais tarde.");
                        nextStep("menu");
                    }
                } else {
                    botSay("Cancelado! Digite *menu* para recomeçar.");
                    nextStep("menu");
                }

                // Limpando as variáveis de estado após o próximo passo
                setSelectedBlocks([]); // Limpa os horários selecionados
                setSelectedHour(""); // Limpa a hora selecionada
                setSelectedDay(undefined); // Limpa o dia selecionado
                setSelectedServices([]); // Limpa os serviços selecionados
                //setBooking(); // Limpa o estado de booking, ou reinicia ele conforme necessário

                break;

            case "finished":
                if (text.toLowerCase() === "menu") {
                    botSay(
                        "Como posso ajudar?\n\n1️⃣ Agendar horário\n2️⃣ Consultar meus horários"
                    );
                    nextStep("menu");
                } else {
                    botSay("Digite *menu* para voltar ao início.");
                }
                break;
            case "askPhoneForConsult":
                botSay("🔍 Só um momento, estou buscando seus agendamentos...");

                try {
                    const res = await fetch(`/api/bookings/by-user?phone=${text}`);
                    const data = await res.json();

                    if (!data.bookings || data.bookings.length === 0) {
                        botSay("😕 Não encontrei nenhum agendamento ativo vinculado a esse número.");
                        botSay("Digite *menu* para voltar ao início.");
                        nextStep("finished");
                        return;
                    }

                    botSay("📆 *Seus agendamentos ativos:*");

                    data.bookings.forEach((b: any) => {
                        const profissional = b.professional ? b.professional.name : "Profissional não informado";

                        const servicos = b.services
                            .map((s: any) => s.service?.name || "")
                            .filter(Boolean)
                            .join(", ");

                        const data = new Date(b.date).toLocaleDateString("pt-BR");
                        const hora = new Date(b.date).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit"
                        });

                        botSay(
                            `✂️ *Profissional:* ${profissional}\n` +
                            `📅 *${data}* às *${hora}*\n` +
                            `💈 *Serviços:* ${servicos}`
                        );
                    });


                    botSay("\nDigite *menu* para voltar ao início.");
                    nextStep("finished");

                } catch (err) {
                    console.error(err);
                    botSay("❌ Erro ao consultar seus horários. Tente novamente mais tarde.");
                    nextStep("menu");
                }

                break;

            default:
                break;
        }
    };

    // ENVIAR MENSAGEM
    const sendMessage = () => {
        if (!input.trim()) return;

        const userText = input.trim();
        setMessages((prev) => [...prev, { id: Date.now(), sender: "user", text: userText }]);

        setInput("");
        setTimeout(() => handleUserReply(userText), 200);
    };

    // ============================================================
    // ==================   RENDERIZAÇÃO   ========================
    // ============================================================

    if (!BARBERSHOP_ID) {
        return (
            <div className="flex h-screen items-center justify-center text-gray-600">
                Carregando barbearia...
            </div>
        );
    }


    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* HEADER */}
            <div className="flex items-center gap-3 p-4 bg-white shadow">
                <Image
                    src="/srcorte.png"
                    alt="Chatbot"
                    width={60}
                    height={60}
                    className="rounded-full object-cover"
                />
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">Sr. Corte</h1>
                    <p className="text-xs text-green-600">Online agora</p>
                </div>
            </div>

            {/* CHAT */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"
                            }`}
                    >
                        <div
                            className={`max-w-[75%] p-3 rounded-2xl text-sm shadow whitespace-pre-line ${msg.sender === "user"
                                ? "bg-blue-600 text-white rounded-br-none"
                                : "bg-white text-gray-800 rounded-bl-none"
                                }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}

                {/* SELEÇÃO DE SERVIÇOS */}
                {step === "askService" && (
                    <div className="flex flex-col gap-2 bg-white p-4 rounded-xl shadow text-gray-900 w-fit">
                        {services.map((s) => (
                            <label
                                key={s.id}
                                className="flex items-center gap-3 cursor-pointer px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition w-fit"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedServices.includes(s.id)}
                                    onChange={() =>
                                        setSelectedServices((prev) =>
                                            prev.includes(s.id)
                                                ? prev.filter((x) => x !== s.id)
                                                : [...prev, s.id]
                                        )
                                    }
                                />
                                <span className="text-sm font-medium">
                                    {s.name} — {s.tempo} min
                                </span>
                            </label>
                        ))}

                        {selectedServices.length > 0 && (
                            <Button
                                className="mt-2 w-fit"
                                onClick={() => {
                                    const selectedNames = services
                                        .filter((s) => selectedServices.includes(s.id))
                                        .map((s) => s.name)
                                        .join(", ");

                                    botSay(`Ótimo! Você selecionou: ${selectedNames}.`);
                                    botSay("Buscando profissionais disponíveis…");

                                    nextStep("confirmServices");
                                    loadProfessionals();
                                }}
                            >
                                Continuar
                            </Button>
                        )}
                    </div>
                )}
                {/* SELEÇÃO DE PROFISSIONAIS */}
                {step === "askProfessional" && (
                    <div className="flex flex-col gap-2 bg-white p-4 rounded-xl shadow text-gray-900 w-fit">
                        {professionals.map((p) => (
                            <label
                                key={p.id}
                                className="flex items-center gap-3 cursor-pointer px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition w-fit"
                            >
                                <input
                                    type="checkbox"
                                    checked={booking.professional === p.id}
                                    onChange={() =>
                                        setBooking((b) => ({
                                            ...b,
                                            professional:
                                                b.professional === p.id ? "" : p.id,
                                        }))
                                    }
                                />
                                <span className="text-sm font-medium">{p.name}</span>
                            </label>
                        ))}

                        {booking.professional && (
                            <Button
                                className="mt-2 w-fit"
                                onClick={() => {
                                    const selected = professionals.find(
                                        (x) => x.id === booking.professional
                                    );
                                    botSay(
                                        `Ótima escolha! Você selecionou ${selected.name}.`
                                    );

                                    fetch(
                                        `/api/professionals/${booking.professional}/schedules`
                                    )
                                        .then((r) => r.json())
                                        .then((sch) =>
                                            setProfessionalSchedules(sch || [])
                                        );

                                    setSelectedDay(undefined);
                                    setSelectedHour("");
                                    setSelectedContiguousSlots([]);
                                    setDayBookings([]);

                                    nextStep("askDate");
                                }}
                            >
                                Continuar
                            </Button>
                        )}
                    </div>
                )}

                {/* CALENDÁRIO + HORÁRIOS */}
                {step === "askDate" && (
                    <div className="bg-white p-4 rounded-xl shadow w-fit">
                        <p className="text-sm mb-2 font-semibold text-gray-800">
                            Selecione a data:
                        </p>

                        <Calendar
                            selected={selectedDay}
                            onSelect={(day) => {
                                if (!day) return;
                                setSelectedDay(day);

                                loadDayBookings(day, booking.professional);

                                setSelectedHour("");
                                setSelectedContiguousSlots([]);
                            }}
                            mode="single"
                            locale={ptBR}
                            className="rounded-xl border"
                            disabled={(date) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                return date < today;
                            }}
                        />

                        {selectedDay && (
                            <>
                                <p className="text-sm font-semibold text-gray-800 mt-4 mb-2">
                                    Horários disponíveis:
                                </p>

                                <div className="grid grid-cols-3 gap-2">
                                    {statusList.map(({ time, disabled }) => {
                                        const isSelected =
                                            selectedBlocks.includes(time);

                                        return (
                                            <button
                                                key={time}
                                                disabled={disabled}
                                                onClick={() => {
                                                    if (disabled) return;

                                                    setSelectedHour(time);

                                                    const totalMinutes = services
                                                        .filter((s) =>
                                                            selectedServices.includes(
                                                                s.id
                                                            )
                                                        )
                                                        .reduce(
                                                            (acc, s) =>
                                                                acc + s.tempo,
                                                            0
                                                        );

                                                    const blocksNeeded = Math.ceil(
                                                        totalMinutes / 30
                                                    );

                                                    const startIndex =
                                                        statusList.findIndex(
                                                            (s) => s.time === time
                                                        );

                                                    const blocks: string[] = [];

                                                    for (
                                                        let i = 0;
                                                        i < blocksNeeded;
                                                        i++
                                                    ) {
                                                        const slot =
                                                            statusList[
                                                            startIndex + i
                                                            ];
                                                        if (
                                                            !slot ||
                                                            slot.disabled
                                                        ) {
                                                            setSelectedBlocks([]);
                                                            return;
                                                        }
                                                        blocks.push(slot.time);
                                                    }

                                                    setSelectedBlocks(blocks);
                                                }}
                                                className={`
                                                    text-xs rounded-full px-3 py-2 border transition
                                                    ${disabled
                                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200"
                                                        : selectedBlocks.includes(
                                                            time
                                                        )
                                                            ? "bg-blue-600 text-white border-blue-600 opacity-100"
                                                            : "bg-white text-gray-700 border-gray-300 hover:bg-blue-100"
                                                    }
                                                `}
                                            >
                                                {time}
                                            </button>
                                        );
                                    })}
                                </div>

                                <p className="text-xs text-gray-500 mt-2">
                                    Tempo total: {totalTempo} min
                                </p>

                                {selectedBlocks.length > 0 && (
                                    <Button
                                        className="mt-4"
                                        onClick={() => {
                                            setSelectedHour(selectedBlocks[0]);

                                            const [hour, minute] = selectedBlocks[0].split(":").map(Number);

                                            const bookingDate = setHours(
                                                setMinutes(new Date(selectedDay!), minute),
                                                hour
                                            );

                                            setBooking((b) => ({
                                                ...b,
                                                date: bookingDate.toISOString(),
                                            }));


                                            const profName =
                                                professionals.find(
                                                    (p) =>
                                                        p.id ===
                                                        booking.professional
                                                )?.name;

                                            const selectedNames = services
                                                .filter((s) =>
                                                    selectedServices.includes(
                                                        s.id
                                                    )
                                                )
                                                .map((s) => s.name)
                                                .join(", ");

                                            const dataFormatada =
                                                selectedDay!.toLocaleDateString(
                                                    "pt-BR"
                                                );
                                            const horaFormatada =
                                                selectedBlocks.join(", ");

                                            botSay(
                                                `✨ *Resumo do agendamento:*\n\n` +
                                                `👤 *Profissional:* ${profName}\n` +
                                                `💈 *Serviços:* ${selectedNames}\n` +
                                                `📅 *Data:* ${dataFormatada}\n` +
                                                `⏰ *Horário:* ${horaFormatada}\n\n` +
                                                `Deseja confirmar? *(sim/não)*`
                                            );

                                            nextStep("confirmBooking");
                                        }}
                                    >
                                        Continuar
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* INPUT */}
            {step !== "askService" &&
                step !== "askProfessional" &&
                step !== "askDate" &&
                step !== "askHour" && (
                    <div className="p-4 bg-white border-t flex gap-2">
                        <input
                            className="flex-1 border rounded-xl p-3 text-base bg-gray-50 font-semibold text-gray-700"
                            style={{ fontSize: "16px" }}
                            placeholder="Digite sua mensagem..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === "Enter" && sendMessage()
                            }
                        />
                        <Button onClick={sendMessage}>Enviar</Button>
                    </div>
                )}
        </div>
    );
}
