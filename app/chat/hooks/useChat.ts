
// app/chat/hooks/useChat.ts
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getTimeStatusList, ScheduleItem } from "../lib/time";
import { Booking, Step } from "../lib/chatTypes";
import {
  fetchServices,
  fetchProfessionalsByServices,
  fetchProfessionalSchedules,
  fetchBookingsByDay,
  createOrGetChatUser,
  createBooking,
  fetchBookingsByUserPhone,
} from "../lib/api";
import { getBarbershopId } from "../../_actions/get-barbershop-id";

export function useChat() {
  const [barbershopId, setBarbershopId] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [professionalSchedules, setProfessionalSchedules] = useState<ScheduleItem[]>([]);
  const [dayBookings, setDayBookings] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [selectedHour, setSelectedHour] = useState<string>("");
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [selectedContiguousSlots, setSelectedContiguousSlots] = useState<string[]>([]);

  const [messages, setMessages] = useState([
    {
      id: Date.now(),
      sender: "bot",
      text:
        "Olá! 👋 Sou o Sr. Corte.\n" +
        "Como posso ajudar hoje?\n\n" +
        "1️⃣ Agendar horário\n" +
        "2️⃣ Consultar meus horários\n",
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const [step, setStep] = useState<Step>("menu");

  const [booking, setBooking] = useState<Booking>({
    name: "",
    phone: "",
    professional: "",
    date: "",
    hour: "",
    userId: "",
  });

  // Carrega BARBERSHOP_ID
  useEffect(() => {
    (async () => {
      const id = await getBarbershopId();
      setBarbershopId(id);
    })();
  }, []);

  // Scroll automático
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const botSay = (text: string) =>
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), sender: "bot", text }]);

  const nextStep = (s: Step) => setStep(s);

  // 🔵 CARREGA SERVIÇOS
  const loadServices = async () => {
    if (!barbershopId) return;
    const data = await fetchServices(barbershopId);
    setServices(data);
    botSay("Perfeito! Selecione abaixo os serviços desejados:");
  };

  // 🔴 CARREGA PROFISSIONAIS
  const loadProfessionals = async () => {
    if (!barbershopId) return;
    const data = await fetchProfessionalsByServices(barbershopId, selectedServices, "all");
    setProfessionals(data);

    if (data.length === 0) {
      botSay("⚠️ Nenhum profissional faz todos os serviços selecionados.");
      return;
    }
    botSay("Perfeito! Escolha abaixo o profissional:");
    nextStep("askProfessional");
  };

  // Horários do profissional
  const loadProfessionalSchedules = async (professionalId: string) => {
    const sch = await fetchProfessionalSchedules(professionalId);
    setProfessionalSchedules(sch || []);
  };

  // Agendamentos do dia
  const loadDayBookings = async (day: Date, professionalId: string) => {
    try {
      const dateParam = day.toISOString();
      const data = await fetchBookingsByDay(dateParam, professionalId);
      setDayBookings(data || []);
    } catch (e) {
      console.error(e);
      setDayBookings([]);
    }
  };

  // Lista de horários com status
  const statusList = useMemo(() => {
    if (!selectedDay) return [];
    return getTimeStatusList({
      professionalSchedules,
      bookings: dayBookings,
      selectedDay,
    });
  }, [selectedDay, dayBookings, professionalSchedules]);

  // Tempo total dos serviços
  const totalTempo = useMemo(() => {
    return services
      .filter((s) => selectedServices.includes(s.id))
      .reduce((acc, s) => acc + (s.tempo || 0), 0);
  }, [selectedServices, services]);

  const roundedSlots = Math.max(1, Math.ceil(totalTempo / 30)); // (não usado diretamente, mantido)

  // -------------------- MENU --------------------
  const handleMenuSelection = (text: string) => {
    const option = text.trim();

    if (option === "1") {
      botSay("Ótimo! Vamos começar seu agendamento. Qual o seu nome?");
      nextStep("askName");
      return;
    }

    if (option === "2") {
      botSay("Claro! Para consultar seus horários, informe seu WhatsApp:");
      nextStep("askPhoneForConsult");
      return;
    }

    botSay("❗ Escolha uma opção válida:\n1️⃣ Agendar horário\n2️⃣ Consultar meus horários");
  };

  // -------------------- CHAT --------------------
  const handleUserReply = async (text: string) => {
    if (step === "menu") {
      handleMenuSelection(text);
      return;
    }

    switch (step) {
      case "askName":
        setBooking((b) => ({ ...b, name: text }));
        botSay(`Prazer, ${text}! Me passa seu WhatsApp?`);
        nextStep("askPhone");
        break;


      case "askPhone":
        setBooking((b) => ({ ...b, phone: text }));
        botSay("Certo! Vou listar os serviços…");

        try {
          const data = await createOrGetChatUser(booking.name, text);
          if (data.user && data.user.id) {
            setBooking((b) => ({ ...b, userId: data.user.id }));

            // ✅ Avança o fluxo imediatamente, sem depender do useEffect
            nextStep("askService");
            await loadServices();
          } else {
            botSay("Erro ao criar seu usuário. Tente novamente.");
            nextStep("menu");
          }
        } catch (e) {
          console.error(e);
          botSay("Erro ao criar seu usuário. Tente novamente.");
          nextStep("menu");
        }
        break;


      case "confirmBooking":
        // Para prod
        botSay("Agendado com sucesso! ✂️\n\nDigite *menu* para voltar ao início.");
        nextStep("finished");
        // Limpa estados pós-agendamento
        setSelectedBlocks([]);
        setSelectedHour("");
        setSelectedDay(undefined);
        setSelectedServices([]);

        // Caso queira usar a API real, remova o return acima e mantenha o bloco abaixo:

        if (text.toLowerCase() === "sim") {
          if (!booking.userId) {
            botSay("Erro ao encontrar seu ID de usuário. Tente novamente.");
            nextStep("menu");
            return;
          }

          try {
            const { ok } = await createBooking({
              userId: booking.userId,
              professionalId: booking.professional,
              date: booking.date,
              serviceIds: selectedServices,
            });

            if (ok) {
              botSay("Agendado com sucesso! ✂️\n\nDigite *menu* para voltar ao início.");
              nextStep("finished");
            } else {
              botSay("Desculpe, ocorreu um erro ao agendar seu horário. Tente novamente.");
              nextStep("menu");
            }
          } catch (error) {
            console.error(error);
            botSay("Houve um erro ao tentar agendar. Tente novamente mais tarde.");
            nextStep("menu");
          }
        } else {
          botSay("Cancelado! Digite *menu* para recomeçar.");
          nextStep("menu");
        }

        setSelectedBlocks([]);
        setSelectedHour("");
        setSelectedDay(undefined);
        setSelectedServices([]);

        break;

      case "finished":
        if (text.toLowerCase() === "menu") {
          botSay("Como posso ajudar?\n\n1️⃣ Agendar horário\n2️⃣ Consultar meus horários");
          nextStep("menu");
        } else {
          botSay("Digite *menu* para voltar ao início.");
        }
        break;

      case "askPhoneForConsult":
        botSay("🔍 Só um momento, estou buscando seus agendamentos...");
        try {
          const data = await fetchBookingsByUserPhone(text);
          if (!data.bookings || data.bookings.length === 0) {
            botSay("😕 Não encontrei nenhum agendamento ativo vinculado a esse número.");
            botSay("Digite *menu* para voltar ao início.");
            nextStep("finished");
            return;
          }

          botSay("📆 *Seus agendamentos ativos:*");

          data.bookings.forEach((b: any) => {
            const profissional = b.professional ? b.professional.name : "Profissional não informado";

            const servicos = b.services
              .map((s: any) => s.service?.name || "")
              .filter(Boolean)
              .join(", ");

            const dataStr = new Date(b.date).toLocaleDateString("pt-BR");
            const horaStr = new Date(b.date).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            });

            botSay(
              `✂️ *Profissional:* ${profissional}\n` +
              `📅 *${dataStr}* às *${horaStr}*\n` +
              `💈 *Serviços:* ${servicos}`
            );
          });

          botSay("\nDigite *menu* para voltar ao início.");
          nextStep("finished");
        } catch (err) {
          console.error(err);
          botSay("❌ Erro ao consultar seus horários. Tente novamente mais tarde.");
          nextStep("menu");
        }
        break;

      default:
        break;
    }
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setMessages((prev) => [...prev, { id: Date.now(), sender: "user", text: userText }]);
    setInput("");
    setTimeout(() => handleUserReply(userText), 200);
  };

  const isReady = !!barbershopId;

  return {
    // estado base
    isReady,
    step,
    nextStep,
    messages,
    botSay,
    bottomRef,
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
    professionalSchedules,
    loadProfessionalSchedules,
    selectedDay,
    setSelectedDay,
    dayBookings,
    setDayBookings,
    statusList,
    totalTempo,
    selectedHour,
    setSelectedHour,
    selectedBlocks,
    setSelectedBlocks,
    selectedContiguousSlots,
    setSelectedContiguousSlots,

    // ações remotas
    loadServices,
    loadProfessionals,
    loadDayBookings,
  };
}