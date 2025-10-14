"use client";

import { useState, useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import BookingItem from "./booking-item";

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: number; // 0 = cancelado, 1 = ativo
  bookingGroup: any;
}

interface BarberCalendarProps {
  bookings: any[];
}

const locales = { "pt-BR": ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function BarberCalendar({ bookings }: BarberCalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const events: Event[] = useMemo(() => {
    return bookings
      .filter((b) => b.status === 1)
      .map((b) => ({
        id: b.id,
        // 👇 Mostrar o nome do profissional no calendário em vez dos serviços
        title: b.professional?.name ?? "Sem profissional",
        start: new Date(b.date),
        end: new Date(new Date(b.date).getTime() + 60 * 60 * 1000),
        status: b.status,
        bookingGroup: b,
      }));
  }, [bookings]);

  const eventStyleGetter = (event: Event) => {
    const isActive = event.status === 1;
    return {
      style: {
        backgroundColor: isActive ? "#22c55e" : "#ef4444",
        color: "white",
        borderRadius: "10px",
        padding: "6px 8px",
        border: "1px solid rgba(255,255,255,0.1)",
        fontWeight: 600,
        boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
        transition: "all 0.2s ease-in-out",
        cursor: "pointer",
      },
    };
  };

  const getTotalPrice = (services: { price: number }[]) =>
    services.reduce((acc, curr) => acc + curr.price, 0);

  return (
    <div className="space-y-4">
      <style jsx global>{`
        .rbc-calendar {
          background-color: #111827;
          color: #e5e7eb;
          border-radius: 12px;
          border: 1px solid #374151;
          padding: 8px;
        }
        .rbc-toolbar {
          color: #f3f4f6;
          font-weight: 600;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: space-between;
        }
        .rbc-toolbar button {
          background-color: #1f2937;
          color: #e5e7eb;
          border: 1px solid #374151;
          border-radius: 8px;
          padding: 6px 12px;
          transition: all 0.2s ease-in-out;
        }
        .rbc-toolbar button:hover {
          background-color: #2563eb;
          color: white;
        }
        .rbc-toolbar button.rbc-active {
          background-color: #2563eb !important;
          color: #fff !important;
          border-color: #2563eb !important;
          font-weight: 700;
        }
        .rbc-header {
          background-color: #1f2937;
          color: #9ca3af;
          border-bottom: 1px solid #374151;
          padding: 8px 0;
        }
        .rbc-month-view {
          border: none;
        }
        .rbc-day-bg {
          border: 1px solid #374151;
        }
        .rbc-off-range-bg {
          background-color: #0f172a;
        }
        .rbc-today {
          background-color: rgba(59, 130, 246, 0.2);
        }
        .rbc-event:hover {
          transform: scale(1.03);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        .rbc-selected {
          background-color: #2563eb !important;
        }
      `}</style>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        onSelectEvent={(event: any) => setSelectedEvent(event)}
        eventPropGetter={eventStyleGetter}
        culture="pt-BR"
        messages={{
          next: "Próximo",
          previous: "Anterior",
          today: "Hoje",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          agenda: "Agenda",
          showMore: (total) => `+${total} mais`,
        }}
        dayPropGetter={() => ({
          style: { border: "1px solid #374151" },
        })}
      />

      {selectedEvent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4 transition-opacity">
          <div className="bg-gray-800 text-white rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-all scale-100">
            <h2 className="text-2xl font-bold mb-4 text-center text-green-400">
              Detalhes do Agendamento
            </h2>

            <BookingItem bookingGroup={selectedEvent.bookingGroup} isBarber={true} />

            <div className="mt-3 border-t border-gray-700 pt-3">
              <p className="text-right font-bold text-lg text-gray-200">
                Total:{" "}
                {Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(getTotalPrice(selectedEvent.bookingGroup.services))}
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedEvent(null)}
                className="border-gray-600 hover:bg-gray-700 hover:text-white"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
