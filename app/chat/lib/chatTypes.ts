
// app/chat/lib/chatTypes.ts
export type Step =
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

export interface Booking {
  name: string;
  phone: string;
  professional: string;
  date: string;
  hour: string;
  userId?: string;
}