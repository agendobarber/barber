// app/chat/components/DateTimePicker.tsx
"use client";

import { Button } from "../../_components/ui/button";
import { Calendar } from "../../_components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { setHours, setMinutes, startOfToday } from "date-fns";
import { useRef } from "react";

export function DateTimePicker({
  selectedDay,
  setSelectedDay,
  bookingProfessional,
  loadDayBookings,
  statusList,
  services,
  selectedServices,
  selectedBlocks,
  setSelectedBlocks,
  botSay,
  professionals,
  booking,
  setBooking,
  totalTempo,
  nextStep,
  // âncoras recebidas do ChatPage
  slotsStartRef,
  slotsEndRef,
}: {
  selectedDay: Date | undefined;
  setSelectedDay: (d: Date | undefined) => void;
  bookingProfessional: string;
  loadDayBookings: (day: Date, professionalId: string) => Promise<void>;
  statusList: { time: string; disabled: boolean }[];
  services: any[];
  selectedServices: string[];
  selectedBlocks: string[];
  setSelectedBlocks: (blocks: string[]) => void;
  botSay: (text: string) => void;
  professionals: any[];
  booking: { professional: string; date: string };
  setBooking: (fn: (b: any) => any) => void;
  totalTempo: number;
  nextStep: (s: any) => void;
  slotsStartRef?: React.RefObject<HTMLDivElement | null>;
  slotsEndRef?: React.RefObject<HTMLDivElement | null>;
}) {
  // âncora do botão "Continuar"
  const continueRef = useRef<HTMLButtonElement | null>(null);

  // hoje (local) no início do dia
  const today = startOfToday();

  return (
    <div className="bg-white p-4 rounded-xl shadow w-fit">
      <p className="text-sm mb-2 font-semibold text-gray-800">Selecione a data:</p>

      <Calendar
        selected={selectedDay}
        onSelect={async (day) => {
          if (!day) return;
          setSelectedDay(day);
          await loadDayBookings(day, bookingProfessional);
          setSelectedBlocks([]);

          // desce para mostrar o botão "Continuar"
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              continueRef.current?.scrollIntoView({
                behavior: "auto",
                block: "end",
                inline: "nearest",
              });
            });
          });
        }}
        mode="single"
        locale={ptBR}
        // abre no mês do dia selecionado, senão no mês atual
        defaultMonth={selectedDay ?? today}
        // 🔒 desabilita apenas dias *antes* de hoje (API oficial react-day-picker)
        disabled={{ before: today }}
        // evita confusão visual com dias de outros meses
        showOutsideDays={false}
        // ✅ Força visual claro para dias habilitados e escuro/sem clique para desabilitados
        classNames={{
          // raiz/painel mantém seu tema
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100",
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          // 👇 os dias em si
          day: "w-9 h-9 p-0 font-normal text-foreground hover:bg-accent hover:text-accent-foreground rounded-md aria-selected:opacity-100",
          day_today:
            "text-foreground ring-1 ring-offset-0 ring-primary/40 rounded-md",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_disabled:
            "opacity-30 cursor-not-allowed pointer-events-none", // 🔒 escuro e sem clique
          day_outside: "opacity-40 pointer-events-none", // outside days apagados
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
        }}
        className="rounded-xl border"
      />

      {selectedDay && (
        <>
          {/* âncora no topo da seção de horários */}
          <div ref={slotsStartRef || null} />

          <p className="text-sm font-semibold text-gray-800 mt-4 mb-2">
            Horários disponíveis:
          </p>

          <div className="grid grid-cols-3 gap-2">
            {statusList.map(({ time, disabled }) => {
              const isSelected = selectedBlocks.includes(time);

              return (
                <button
                  key={time}
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return;

                    const totalMinutes = services
                      .filter((s: any) => selectedServices.includes(s.id))
                      .reduce((acc: number, s: any) => acc + s.tempo, 0);

                    const blocksNeeded = Math.ceil(totalMinutes / 30);
                    const startIndex = statusList.findIndex((s) => s.time === time);

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
                    ${
                      disabled
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200"
                        : isSelected
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

          <p className="text-xs text-gray-500 mt-2">Tempo total: {totalTempo} min</p>

          {/* botão sempre visível; desabilitado até haver horário selecionado */}
          <Button
            ref={continueRef}
            className="mt-4"
            disabled={selectedBlocks.length === 0}
            onClick={() => {
              if (!selectedDay || selectedBlocks.length === 0) return;

              const [hour, minute] = selectedBlocks[0].split(":").map(Number);
              const bookingDate = setHours(setMinutes(new Date(selectedDay), minute), hour);

              setBooking((b: any) => ({
                ...b,
                date: bookingDate.toISOString(),
              }));

              const profName =
                professionals.find((p: any) => p.id === booking.professional)?.name || "";
              const selectedNames = services
                .filter((s: any) => selectedServices.includes(s.id))
                .map((s: any) => s.name)
                .join(", ");

              const dataFormatada = selectedDay.toLocaleDateString("pt-BR");
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

          {/* âncora no fim da seção de horários */}
          <div ref={slotsEndRef || null} />
        </>
      )}
    </div>
  );
}