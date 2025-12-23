
// app/instrumentation.ts
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

console.log("INSTRUMENTAL");

function computeUtcWindow(nowLocal: Date) {
  const n = new Date(nowLocal);
  n.setSeconds(0, 0);
  const rounded = n.getMinutes() < 30 ? 0 : 30;

  const targetLocal = new Date(n);
  targetLocal.setMinutes(rounded, 0, 0);
  targetLocal.setHours(targetLocal.getHours() + 1);

  const startLocal = new Date(targetLocal);
  const endLocal = new Date(targetLocal);
  endLocal.setMinutes(endLocal.getMinutes() + 30);

  const rangeStartUTC = new Date(startLocal.getTime());
  const rangeEndUTC = new Date(endLocal.getTime());
  return { rangeStartUTC, rangeEndUTC, targetLocal };
}

async function runOnce() {
  const nowLocal = new Date();
  const { rangeStartUTC, rangeEndUTC, targetLocal } = computeUtcWindow(nowLocal);

  const bookings = await db.booking.findMany({
    where: { status: 1, date: { gte: rangeStartUTC, lt: rangeEndUTC } },
    select: {
      id: true, date: true,
      user: { select: { name: true } },
      professional: { select: { name: true } },
    },
    orderBy: { date: 'asc' },
  });

  const fmtIsoMin = (d: Date) => d.toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
  const fmtLocalMin = (d: Date) => d.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  console.log(
    `[CRON] Janela +1h (local: ${fmtLocalMin(targetLocal)}) ` +
    `UTC [${fmtIsoMin(rangeStartUTC)} – ${fmtIsoMin(rangeEndUTC)}] => ${bookings.length} agendamento(s).`
  );
}

// instrumentation.ts (na raizs)
export async function register() {
  // seu código atual:
  runOnce().catch((e) => console.error('[CRON] Erro primeira execução:', e));

  cron.schedule('0,30 7-21 * * *', () => {
    runOnce().catch((err) => console.error('[CRON] Erro runOnce:', err));
  }, { timezone: 'America/Sao_Paulo' });

  console.log('[CRON] Agendado em instrumentation.ts (App Router).');
}

