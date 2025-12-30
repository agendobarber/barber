
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/app/_lib/prisma';
import { authOptions } from '@/app/_lib/auth';

export async function GET(req: Request) {

  const shop = await db.barbershop.findFirst();


  if (!shop?.id) {
    return NextResponse.json({ error: 'barbershopId é obrigatório' }, { status: 400 });
  }

  try {
    const setting = await db.themeSetting.findUnique({
      where: { barbershopId: shop?.id },
    });

    return NextResponse.json({ mode: setting?.mode ?? 'system' });
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar tema' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // Opcional: validar sessão para garantir que apenas admin altera
  const session = await getServerSession(authOptions);

  const body = await req.json().catch(() => null);
  const { barbershopId, mode } = body || {};

  if (!barbershopId || !mode || !['light', 'dark', 'system'].includes(mode)) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
  }

  // Se quiser bloquear quem não é admin:
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, barbershopId: true },
    });

    // Permitir apenas admin da barbearia correspondente
    if (!user || user.role !== 'admin' || user.barbershopId !== barbershopId) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const setting = await db.themeSetting.upsert({
      where: { barbershopId },
      update: { mode },
      create: { barbershopId, mode },
      select: { mode: true },
    });

    return NextResponse.json({ mode: setting.mode });
  } catch {
    return NextResponse.json({ error: 'Erro ao salvar tema' }, { status: 500 });
  }
}
