import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "../_lib/auth";
import BarbershopFormComponent from "../_components/BarbershopFormComponent";
import { db } from "../_lib/prisma";
import { requireRole } from "../_lib/requireRole";

const EditBarbershop = async () => {
  await requireRole("admin"); // bloqueia usuário comum
  const session = await getServerSession(authOptions);

  if (!session?.user) return notFound();

  // Busca a barbearia do usuário logado
  const barbershop = await db.barbershop.findFirst({
    where: {
      admins: {
        some: { id: (session.user as any).id },
      },
    },
  });

  if (!barbershop) return notFound();

  return <BarbershopFormComponent barbershop={barbershop} />;
};

export default EditBarbershop;
