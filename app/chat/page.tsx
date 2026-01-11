
// app/chat/page.tsx
"use client";

import { useChat } from "./hooks/useChat";
import { MessagesList } from "./components/MessagesList";
import { ServiceSelector } from "./components/ServiceSelector";
import { ProfessionalSelector } from "./components/ProfessionalSelector";
import { DateTimePicker } from "./components/DateTimePicker";

import { ChatInput } from "./components/ChatInput";
import Header from "./components/Header";

export default function ChatPage() {
    const {
        isReady,
        // mensagens e navegação
        messages,
        bottomRef,
        step,
        nextStep,
        botSay,

        // input
        input,
        setInput,
        sendMessage,

        // dados
        services,
        professionals,
        selectedServices,
        setSelectedServices,
        booking,
        setBooking,

        // horários e agenda
        loadProfessionalSchedules,
        selectedDay,
        setSelectedDay,
        loadDayBookings,
        statusList,
        totalTempo,
        selectedBlocks,
        setSelectedBlocks,
        loadProfessionals,
    } = useChat();

    if (!isReady) {
        return (
            <div className="flex h-screen items-center justify-center text-gray-600">
                Abrindo...
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* HEADER */}
            <Header />

            {/* CHAT (mensagens) */}
            <MessagesList messages={messages as any} bottomRef={bottomRef} />

            {/* SELEÇÃO DE SERVIÇOS */}
            {step === "askService" && (
                <ServiceSelector
                    services={services}
                    selectedServices={selectedServices}
                    setSelectedServices={setSelectedServices as any}
                    onContinue={() => {
                        const selectedNames = services
                            .filter((s: any) => selectedServices.includes(s.id))
                            .map((s: any) => s.name)
                            .join(", ");

                        botSay(`Ótimo! Você selecionou: ${selectedNames}.`);
                        botSay("Buscando profissionais disponíveis…");
                        nextStep("confirmServices");
                        // Carrega profissionais após seleção de serviços
                        (async () => {
                            await (async () => {
                                loadProfessionals();
                            })();
                        })();
                    }}
                />
            )}

            {/* SELEÇÃO DE PROFISSIONAIS */}
            {step === "askProfessional" && (
                <ProfessionalSelector
                    professionals={professionals}
                    bookingProfessional={booking.professional}
                    setBookingProfessional={(newId) =>
                        setBooking((b) => ({ ...b, professional: newId }))
                    }
                    onContinue={async () => {
                        if (!booking.professional) return;

                        botSay(
                            `Ótima escolha! Você selecionou ${professionals.find((x: any) => x.id === booking.professional)?.name
                            }.`
                        );

                        await loadProfessionalSchedules(booking.professional);

                        // Reset de seleção de data/horário
                        setSelectedDay(undefined);
                        setSelectedBlocks([]);

                        nextStep("askDate");
                    }}
                />
            )}

            {/* CALENDÁRIO + HORÁRIOS */}
            {step === "askDate" && (
                <DateTimePicker
                    selectedDay={selectedDay}
                    setSelectedDay={setSelectedDay}
                    bookingProfessional={booking.professional}
                    loadDayBookings={loadDayBookings}
                    statusList={statusList}
                    services={services}
                    selectedServices={selectedServices}
                    selectedBlocks={selectedBlocks}
                    setSelectedBlocks={setSelectedBlocks}
                    botSay={botSay}
                    professionals={professionals}
                    booking={booking as any}
                    setBooking={setBooking as any}
                    totalTempo={totalTempo}
                    nextStep={nextStep as any}
                />
            )}

            {/* INPUT (quando necessário) */}
            {step !== "askService" &&
                step !== "askProfessional" &&
                step !== "askDate" &&
                step !== "askHour" && (
                    <ChatInput input={input} setInput={setInput} sendMessage={sendMessage} />
                )}
        </div>
    );
}