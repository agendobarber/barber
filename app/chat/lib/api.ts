
// app/chat/lib/api.ts

/** Serviços da barbearia */
export async function fetchServices(barbershopId: string) {
  const res = await fetch(`/api/barbershop/${barbershopId}/services`);
  if (!res.ok) throw new Error("Erro ao carregar serviços");
  return res.json();
}

/** Profissionais que atendem os serviços selecionados */
export async function fetchProfessionalsByServices(
  barbershopId: string,
  servicesIds: string[],
  match: "all" | "any" = "all"
) {
  const res = await fetch(`/api/barbershop/${barbershopId}/professionals-by-service`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ servicesIds, match }),
  });
  if (!res.ok) throw new Error("Erro ao carregar profissionais");
  return res.json();
}

/** Horários configurados do profissional */
export async function fetchProfessionalSchedules(professionalId: string) {
  const res = await fetch(`/api/professionals/${professionalId}/schedules`);
  if (!res.ok) throw new Error("Erro ao carregar horários do profissional");
  return res.json();
}

/** Agendamentos por dia e profissional */
export async function fetchBookingsByDay(dateIso: string, professionalId: string) {
  const res = await fetch(
    `/api/bookings/by-day?date=${dateIso}&professionalId=${professionalId}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );
  if (!res.ok) throw new Error("Erro ao buscar agendamentos por dia");
  return res.json();
}

/** Cria ou obtém usuário do chat */
export async function createOrGetChatUser(name: string, phone: string) {
  const res = await fetch("/api/chat/create-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, phone }),
  });
  if (!res.ok) throw new Error("Erro ao criar/obter usuário do chat");
  return res.json();
}

/** Agenda com usuário (não usado no "Para prod" com retorno imediato) */
export async function createBooking(payload: {
  userId: string;
  professionalId: string;
  date: string;
  serviceIds: string[];
}) {
  const res = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

/** Consulta agendamentos por telefone */
export async function fetchBookingsByUserPhone(phone: string) {
  const res = await fetch(`/api/bookings/by-user?phone=${phone}`);
  if (!res.ok) throw new Error("Erro ao consultar agendamentos do usuário");
  return res.json();
}
