
// app/chat/components/DateTimePicker.tsx
"use client";

import { Button } from "../../_components/ui/button";
import { Calendar } from "../../_components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { setHours, setMinutes } from "date-fns";

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
}) {
  return (
    <div className="bg-white p-4 rounded-xl shadow w-fit">
      <p className="text-sm mb-2 font-semibold text-gray-800">Selecione a data:</p>

      <Calendar
        selected={selectedDay}
        onSelect={(day) => {
          if (!day) return;
          setSelectedDay(day);
          loadDayBookings(day, bookingProfessional);
          setSelectedBlocks([]);
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
                    ${disabled
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200"
                      : isSelected
                      ? "bg-blue-600 text-white border-blue-600 opacity-100"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-blue-100"}
                  `}
                >
                  {time}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-gray-500 mt-2">Tempo total: {totalTempo} min</p>

          {selectedBlocks.length > 0 && (
            <Button
              className="mt-4"
              onClick={() => {
                const [hour, minute] = selectedBlocks[0].split(":").map(Number);
                const bookingDate = setHours(setMinutes(new Date(selectedDay!), minute), hour);

                setBooking((b: any) => ({
                  ...b,
                  date: bookingDate.toISOString(),
                }));

                const profName = professionals.find((p: any) => p.id === booking.professional)?.name;
                const selectedNames = services
                  .filter((s: any) => selectedServices.includes(s.id))
                  .map((s: any) => s.name)
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
  );
}
