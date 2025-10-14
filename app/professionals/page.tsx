import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "../_lib/auth";
import { db } from "../_lib/prisma";
import BarbershopProfessionalsComponent from "../_components/barbershopProfessionalsComponent";
import { requireRole } from "../_lib/requireRole";

const ProfessionalsBarbershop = async () => {
  await requireRole("admin"); // bloqueia usuário comum
  const session = await getServerSession(authOptions);

  if (!session?.user) return notFound();

  const barbershop = await db.barbershop.findFirst({
    where: {
      admins: {
        some: { id: (session.user as any).id },
      },
    },
    include: {
      professionals: true,
    },
  });

  if (!barbershop) return notFound();

  return <BarbershopProfessionalsComponent barbershop={barbershop} />;
};

export default ProfessionalsBarbershop;
