
// instrumentation.ts (ideal: na raiz do projeto)
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

// Base absoluta para chamar /api/push/send do lado do servidor
// Em desenvolvimento: APP_BASE_URL=http://localhost:3000
// Em produção (Railway): APP_BASE_URL=https://seu-dominio.railway.app
const APP_BASE_URL = process.env.APP_BASE_URL ?? 'http://localhost:3000';

console.log('INSTRUMENTAL');

// ---------- Helpers (sempre America/Sao_Paulo p/ exibição) ----------
const fmtIsoMin = (d: Date) =>
  d.toISOString().replace('T', ' ').substring(0, 16) + ' UTC';

const fmtLocalTimeSP = (d: Date) =>
  d.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  });

const fmtLocalDateSP = (d: Date) =>
  d.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
  });

const fmtWeekdaySP = (d: Date) =>
  d.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
  });

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- Janela +1h (timezone-safe em SP; consulta em UTC) ----------
function computeUtcWindow(now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    hourCycle: 'h23',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);

  const hSP = get('hour');
  const mSP = get('minute');

  const roundedMin = mSP < 30 ? 0 : 30;
  const targetTotalMinSP = (hSP + 1) * 60 + roundedMin;
  const currentTotalMinSP = hSP * 60 + mSP;
  const deltaMin = targetTotalMinSP - currentTotalMinSP;

  const rangeStartUTC = new Date(now.getTime() + deltaMin * 60_000);
  rangeStartUTC.setSeconds(0, 0);
  const rangeEndUTC = new Date(rangeStartUTC.getTime() + 30 * 60_000);

  const targetLocal = rangeStartUTC; // exibição em SP pelos formatters

  return { rangeStartUTC, rangeEndUTC, targetLocal };
}

// ---------- Envio de push (mantendo seu estilo de fetch/await) ----------
async function sendPushCliente(pushMessage: {
  title: string;
  message: string;
  userId: string | number;
}) {
  const url = new URL('/api/push/send/remember', APP_BASE_URL).toString();

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Se sua rota exigir token interno:
    // headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.INTERNAL_TOKEN}` },
    body: JSON.stringify(pushMessage),
  });

  const data = await res.json().catch(() => null);

  console.log('Resposta do servidor:', data);

  if (res.ok) {
    console.log('Push enviado com sucesso!');
  } else {
    console.log('Erro ao enviar push: ' + (data?.error ?? `HTTP ${res.status}`));
  }

  return res.ok;
}

// ---------- Job principal ----------
async function runOnce() {
  const now = new Date();
  const { rangeStartUTC, rangeEndUTC, targetLocal } = computeUtcWindow(now);

  const bookings = await db.booking.findMany({
    where: { status: 1, date: { gte: rangeStartUTC, lt: rangeEndUTC } },
    select: {
      id: true,
      date: true,
      // ajuste conforme seu schema:
      userId: true, // se existir
      user: { select: { id: true, name: true } },
      professional: { select: { id: true, name: true } },
    },
    orderBy: { date: 'asc' },
  });

  console.log(
    `[CRON] Janela +1h (local: ${fmtLocalTimeSP(targetLocal)}) ` +
      `UTC [${fmtIsoMin(rangeStartUTC)} – ${fmtIsoMin(rangeEndUTC)}] => ${bookings.length} agendamento(s).`,
  );

  if (bookings.length === 0) return;

  // Envia um push por agendamento (para o CLIENTE), sequencialmente (await por await)
  for (const b of bookings) {
    const clienteNome = b.user?.name ?? 'Cliente';
    const diaSem = capitalize(fmtWeekdaySP(b.date)); // "Terça-feira"
    const dataStr = fmtLocalDateSP(b.date);          // "23/12/2025"
    const horaStr = fmtLocalTimeSP(b.date);          // "13:30"

    const title = 'Lembrete de agendamento';
    const message =
      `Lembrete: seu horário está marcado para ${diaSem} (${dataStr}) ` +
      `às ${horaStr}. Te esperamos!`;

    const targetUserId = b.user?.id ?? b.userId;
    if (!targetUserId) {
      console.log(`booking#${b.id}: userId do cliente ausente, pulando.`);
      continue;
    }

    await sendPushCliente({
      title,
      message,
      userId: targetUserId,
    });
  }
}

// ---------- Registro do cron ----------
export async function register() {
  // Garante que só rode no runtime Node
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== 'nodejs') {
    console.log('[CRON] Instrumentation ignorado (runtime diferente de Node).');
    return;
  }

  // Executa uma vez ao iniciar
  runOnce().catch((e) => console.error('[CRON] Erro primeira execução:', e));

  // Dispara nos minutos 0 e 30, entre 07h e 21h, em America/Sao_Paulo
  cron.schedule(
    '0,30 7-21 * * *',
    () => {
      runOnce().catch((err) => console.error('[CRON] Erro runOnce:', err));
    },
    { timezone: 'America/Sao_Paulo' },
  );

  console.log('[CRON] Agendado em instrumentation.ts (App Router).');
}
``
