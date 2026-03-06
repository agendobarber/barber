// app/chat/page.tsx
"use client";

import { useChat } from "./hooks/useChat";
import { MessagesList } from "./components/MessagesList";
import { ServiceSelector } from "./components/ServiceSelector";
import { ProfessionalSelector } from "./components/ProfessionalSelector";
import { DateTimePicker } from "./components/DateTimePicker";

import { ChatInput } from "./components/ChatInput";
import Header from "./components/Header";
import { useEffect, useRef } from "react";

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

    // âncora do balão atual (garante que o topo do componente fique visível)
    const stepAnchorRef = useRef<HTMLDivElement | null>(null);
    // âncoras da seção "Horários disponíveis"
    const slotsStartRef = useRef<HTMLDivElement | null>(null);
    const slotsEndRef = useRef<HTMLDivElement | null>(null);

    // rola para o topo do balão ao trocar de step
    useEffect(() => {
        stepAnchorRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
        });
    }, [step]);

    // autoscroll padrão para o fim quando muda step (evita brigar no askDate)
    useEffect(() => {
        if (step === "askDate") return;
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [step, bottomRef]);

    // 🔧 rolagem determinística para manter TODA a seção de horários visível (quando couber)
    const adjustingRef = useRef(false);
    const scrollSlotsIntoViewFully = () => {
        if (adjustingRef.current) return;
        const container = document.querySelector('[data-chat-scroll]') as HTMLElement | null;
        const startEl = slotsStartRef.current;
        const endEl = slotsEndRef.current || slotsStartRef.current;
        if (!container || !startEl || !endEl) return;

        adjustingRef.current = true;
        const margin = 12; // respiro

        const doAdjust = () => {
            const cRect = container.getBoundingClientRect();
            const sTop = startEl.getBoundingClientRect().top - cRect.top + container.scrollTop;
            const eBottom = endEl.getBoundingClientRect().bottom - cRect.top + container.scrollTop;

            const viewHeight = container.clientHeight;
            const sectionHeight = eBottom - sTop + margin;

            // alvo: mostrar o topo; se a seção não couber, prioriza também mostrar o final
            let targetTop = sTop - margin;
            if (sectionHeight > viewHeight) {
                targetTop = eBottom - viewHeight + margin;
            }

            // clamp para não extrapolar
            const maxTop = Math.max(0, container.scrollHeight - viewHeight);
            if (targetTop < 0) targetTop = 0;
            if (targetTop > maxTop) targetTop = maxTop;

            // sem smooth para não “voltar”
            container.scrollTo({ top: targetTop, behavior: "auto" });
        };

        // 1ª passada após layout
        requestAnimationFrame(() => {
            doAdjust();
            // 2ª passada curta para caso a grid ainda cresça alguns px
            setTimeout(() => {
                doAdjust();
                adjustingRef.current = false;
            }, 120);
        });
    };

    // Quando clicar em um dia e os horários forem carregados,
    // garante que a seção de horários apareça completa (sem voltar para o calendário)
    useEffect(() => {
        if (step !== "askDate") return;
        if (!selectedDay || statusList.length === 0) return;

        // aguarda o layout estabilizar antes de medir/rolar
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                scrollSlotsIntoViewFully();
            });
        });
    }, [step, selectedDay, statusList.length]);

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
            <MessagesList messages={messages as any} bottomRef={bottomRef}>
                {/* Balão do bot para conteúdos customizados */}
                {step === "askService" && (
                    <div ref={stepAnchorRef} className="flex justify-start">
                        <div className="max-w-[75%] bg-white text-gray-800 rounded-2xl rounded-bl-none p-3 shadow">
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
                                    (async () => { loadProfessionals(); })();
                                }}
                            />
                        </div>
                    </div>
                )}

                {step === "askProfessional" && (
                    <div ref={stepAnchorRef} className="flex justify-start">
                        <div className="max-w-[75%] bg-white text-gray-800 rounded-2xl rounded-bl-none p-3 shadow">
                            <ProfessionalSelector
                                professionals={professionals}
                                bookingProfessional={booking.professional}
                                setBookingProfessional={(newId) =>
                                    setBooking((b) => ({ ...b, professional: newId }))
                                }
                                onContinue={async () => {
                                    if (!booking.professional) return;
                                    botSay(
                                        `Ótima escolha! Você selecionou ${
                                            professionals.find((x: any) => x.id === booking.professional)?.name
                                        }.`
                                    );
                                    await loadProfessionalSchedules(booking.professional);
                                    setSelectedDay(undefined);
                                    setSelectedBlocks([]);
                                    nextStep("askDate");
                                }}
                            />
                        </div>
                    </div>
                )}

                {step === "askDate" && (
                    <div ref={stepAnchorRef} className="flex justify-start">
                        <div className="max-w-[75%] bg-white text-gray-800 rounded-2xl rounded-bl-none p-3 shadow">
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
                                // âncoras para a seção de horários
                                slotsStartRef={slotsStartRef}
                                slotsEndRef={slotsEndRef}
                            />
                        </div>
                    </div>
                )}
            </MessagesList>

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
