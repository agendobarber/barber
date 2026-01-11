
// app/chat/lib/time.ts
import { setHours, setMinutes, isPast, isToday } from "date-fns";

export type ScheduleItem = {
  dayOfWeek: number;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
};

/** Gera time slots de 30min de acordo com o dia selecionado e os horários do profissional */
export const generateProfessionalTimeSlots = (
  schedules: ScheduleItem[],
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

/** Retorna a lista de horários com o status (disabled) considerando passado e reservado */
export const getTimeStatusList = ({
  professionalSchedules,
  bookings,
  selectedDay,
}: {
  professionalSchedules: ScheduleItem[];
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
