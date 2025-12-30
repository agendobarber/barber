
"use client";

import { useState, useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import BookingItem from "./booking-item";
import "@/app/_styles/calendar-toolbar.css"; // 👉 importe APENAS o toolbar scoped

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
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const events: Event[] = useMemo(() => {
    return bookings
      .filter((b) => b.status === 1)
      .map((b) => ({
        id: b.id,
        title: b.professional?.name ?? "Sem profissional",
        start: new Date(b.date),
        end: new Date(new Date(b.date).getTime() + 60 * 60 * 1000),
        status: b.status,
        bookingGroup: b,
      }));
  }, [bookings]);

  const eventStyleGetter = () => ({
    style: {
      backgroundColor: "var(--event-active)",
      color: "var(--event-active-foreground)",
      borderRadius: "10px",
      padding: "6px 8px",
      border: "1px solid var(--border)",
      fontWeight: 600,
      boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
      transition: "all 0.2s ease-in-out",
      cursor: "pointer",
    },
  });

  return (
    <div className="space-y-4 calendar-toolbar-scope">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        onSelectEvent={(event: Event) => {
          setSelectedEvent(event);
          setIsSheetOpen(true); // 👉 abre direto a lateral
        }}
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
          style: { border: "1px solid var(--border)" },
        })}
      />

      {/* Renderiza a Sheet do BookingItem sem o card/trigger */}
      {selectedEvent && (
        <BookingItem
          bookingGroup={selectedEvent.bookingGroup}
          isBarber={true}
          open={isSheetOpen}
          onOpenChange={(open) => {
            setIsSheetOpen(open);
            // quando fechar a lateral, limpamos o evento selecionado
            if (!open) setSelectedEvent(null);
          }}
          showCardTrigger={false} // 👉 oculta o card, deixa só a lateral
        />
      )}
    </div>
  );
}
