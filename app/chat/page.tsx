"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { Button } from "../_components/ui/button";
import { Calendar } from "../_components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { setHours, setMinutes, isPast, isToday } from "date-fns";

// ---------------------- TIPOS ----------------------
type Step =
    | "start"
    | "askName"
    | "askPhone"
    | "askService"
    | "confirmServices"
    | "askProfessional"
    | "askDate"
    | "askHour"
    | "confirmBooking"
    | "finished";

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

    // aqui guardamos os blocos contíguos selecionados (ex: ["08:00","08:30","09:00"])
    const [selectedContiguousSlots, setSelectedContiguousSlots] = useState<string[]>([]);

    const [messages, setMessages] = useState([
        { id: Date.now(), sender: "bot", text: "Olá! 👋 Sou o Sr. Corte. Vamos agendar seu horário?" },
    ]);

    const BARBERSHOP_ID = "614d25f3-0128-4237-86b9-fc6ad2ba4c7f";

    const bottomRef = useRef<HTMLDivElement>(null);
    const [input, setInput] = useState("");

    const [step, setStep] = useState<Step>("start");

    const [booking, setBooking] = useState({ name: "", phone: "", professional: "", date: "", hour: "" });

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const botSay = (text: string) => {
        setMessages((prev) => [...prev, { id: Date.now() + Math.random(), sender: "bot", text }]);
    };

    const nextStep = (s: Step) => setStep(s);

    // 🔵 CARREGA SERVIÇOS
    const loadServices = async () => {
        const res = await fetch(`/api/barbershop/${BARBERSHOP_ID}/services`);
        const data = await res.json();
        setServices(data);
        botSay("Perfeito! Selecione abaixo os serviços desejados:");
    };

    // 🔴 CARREGA PROFISSIONAIS (match = "all" por enquanto)
    const loadProfessionals = async () => {
        const res = await fetch(`/api/barbershop/${BARBERSHOP_ID}/professionals-by-service`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ servicesIds: selectedServices, match: "all" }),
        });

        const data = await res.json();
        setProfessionals(data);

        if (data.length === 0) {
            botSay("⚠️ Nenhum profissional faz todos os serviços selecionados.");
            return;
        }

        botSay("Perfeito! Escolha abaixo o profissional:");
        nextStep("askProfessional");
    };

    const loadDayBookings = async (day: Date, professionalId: string) => {
        const res = await fetch("/api/bookings/by-day", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: day, professionalId }),
        });
        const data = await res.json();
        setDayBookings(data || []);
    };

    // HORÁRIOS DISPONÍVEIS
    const statusList = useMemo(() => {
        if (!selectedDay) return [];
        return getTimeStatusList({ professionalSchedules, bookings: dayBookings, selectedDay });
    }, [selectedDay, dayBookings, professionalSchedules]);

    // calcula totalTempo (em minutos) baseado nos serviços selecionados
    const totalTempo = useMemo(() => {
        return services
            .filter((s) => selectedServices.includes(s.id))
            .reduce((acc, s) => acc + (s.tempo || 0), 0);
    }, [selectedServices, services]);

    const roundedSlots = Math.max(1, Math.ceil(totalTempo / 30)); // quantos blocos de 30min precisamos

    // -------------------- LÓGICA CHAT --------------------
    const handleUserReply = (text: string) => {
        switch (step) {
            case "start":
                botSay("Qual o seu nome?");
                nextStep("askName");
                break;

            case "askName":
                setBooking((b) => ({ ...b, name: text }));
                botSay(`Prazer, ${text}! Me passa seu WhatsApp?`);
                nextStep("askPhone");
                break;

            case "askPhone":
                setBooking((b) => ({ ...b, phone: text }));
                botSay("Certo! Vou listar os serviços…");
                nextStep("askService");
                loadServices();
                break;

            case "confirmBooking":
                if (text.toLowerCase() === "sim") {
                    botSay("Agendado com sucesso! ✂️");
                    nextStep("finished");
                } else {
                    botSay("Cancelado! Digite 'oi' para recomeçar.");
                    nextStep("start");
                }
                break;

            case "finished":
                botSay("Se quiser marcar outro horário, só dizer!");
                nextStep("start");
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
    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* HEADER */}
            <div className="flex items-center gap-3 p-4 bg-white shadow">
                <Image src="/srcorte.png" alt="Chatbot" width={60} height={60} className="rounded-full object-cover" />
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">Sr. Corte</h1>
                    <p className="text-xs text-green-600">Online agora</p>
                </div>
            </div>

            {/* CHAT */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
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
                            <label key={s.id} className="flex items-center gap-3 cursor-pointer px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition w-fit">
                                <input
                                    type="checkbox"
                                    checked={selectedServices.includes(s.id)}
                                    onChange={() =>
                                        setSelectedServices((prev) =>
                                            prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]
                                        )
                                    }
                                />
                                <span className="text-sm font-medium">{s.name} — {s.tempo} min</span>
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
                            <label key={p.id} className="flex items-center gap-3 cursor-pointer px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition w-fit">
                                <input
                                    type="checkbox"
                                    checked={booking.professional === p.id}
                                    onChange={() =>
                                        setBooking((b) => ({ ...b, professional: b.professional === p.id ? "" : p.id }))
                                    }
                                />
                                <span className="text-sm font-medium">{p.name}</span>
                            </label>
                        ))}

                        {booking.professional && (
                            <Button
                                className="mt-2 w-fit"
                                onClick={() => {
                                    const selected = professionals.find((x) => x.id === booking.professional);
                                    botSay(`Ótima escolha! Você selecionou ${selected.name}.`);

                                    // Load schedule BEFORE going to calendar
                                    fetch(`/api/professionals/${booking.professional}/schedules`)
                                        .then((r) => r.json())
                                        .then((sch) => setProfessionalSchedules(sch || []));

                                    // reset calendar/time selections
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

                {/* CALENDÁRIO FIXO + HORÁRIOS ABAIXO */}
                {step === "askDate" && (
                    <div className="bg-white p-4 rounded-xl shadow w-fit">
                        <p className="text-sm mb-2 font-semibold text-gray-800">Selecione a data:</p>

                        <Calendar
                            selected={selectedDay}
                            onSelect={(day) => {
                                if (!day) return;
                                setSelectedDay(day);
                                // ao mudar o dia, precisamos recarregar bookings do dia
                                loadDayBookings(day, booking.professional);
                                // reset horário selecionado
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

                        {/* HORÁRIOS só aparecem DEPOIS que o dia foi escolhido */}
                        {selectedDay && (
                            <>
                                <p className="text-sm font-semibold text-gray-800 mt-4 mb-2">Horários disponíveis:</p>

                                <div className="grid grid-cols-3 gap-2">
                                    {statusList.map(({ time, disabled }) => {
                                        const isSelected = selectedContiguousSlots.includes(time);

                                        // classes claras e legíveis:
                                        const base = "text-xs rounded-full px-3 py-2 border";
                                        const availClass = disabled
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100"
                                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50";
                                        const selClass = isSelected ? "bg-blue-600 text-white border-blue-600" : "";

                                        return (
                                            <button
                                                key={time}
                                                disabled={disabled}
                                                onClick={() => {
                                                    if (disabled) return;

                                                    setSelectedHour(time);

                                                    const totalMinutes = services
                                                        .filter(s => selectedServices.includes(s.id))
                                                        .reduce((acc, s) => acc + s.tempo, 0);

                                                    const blocksNeeded = Math.ceil(totalMinutes / 30);

                                                    const startIndex = statusList.findIndex(s => s.time === time);
                                                    const blocks: string[] = [];

                                                    for (let i = 0; i < blocksNeeded; i++) {
                                                        const slot = statusList[startIndex + i];
                                                        if (!slot || slot.disabled) {
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
                                                        : selectedBlocks.includes(time)
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

                                {/* totalTempo info (opcional, útil para o usuário) */}
                                <p className="text-xs text-gray-500 mt-2">Tempo total: {totalTempo} min</p>

                                {selectedBlocks.length > 0 && (
                                    <Button
                                        className="mt-4"
                                        onClick={() => {
                                            // confirma seleção múltipla de blocos
                                            setSelectedHour(selectedBlocks[0]);
                                            setBooking((b) => ({
                                                ...b,
                                                date: selectedDay!.toISOString(),
                                                hour: selectedBlocks[0],
                                            }));

                                            const profName = professionals.find(p => p.id === booking.professional)?.name;
                                            const selectedNames = services
                                                .filter(s => selectedServices.includes(s.id))
                                                .map(s => s.name)
                                                .join(", ");

                                            const dataFormatada = selectedDay!.toLocaleDateString("pt-BR");
                                            const horaFormatada = selectedBlocks.join(", ");

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
            {step !== "askService" && step !== "askProfessional" && step !== "askDate" && step !== "askHour" && (
                <div className="p-4 bg-white border-t flex gap-2">
                    <input
                        className="flex-1 border rounded-xl p-3 text-sm bg-gray-50"
                        placeholder="Digite sua mensagem..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <Button onClick={sendMessage}>Enviar</Button>
                </div>
            )}
        </div>
    );
}
