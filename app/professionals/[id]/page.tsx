import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";
import ProfessionalFormComponent from "@/app/_components/professionalFormComponent";

const EditProfessionalPage = async ({ params }: any) => {
  // params pode ser undefined em build, defensivo
  if (!params?.id) return notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user) return notFound();

  const professional = await db.professional.findUnique({
    where: { id: params.id },
    include: { barbershop: { include: { admins: true } } },
  });

  if (!professional) return notFound();

  const isAdmin = professional.barbershop.admins.some(
    (admin: any) => admin.id === (session.user as any).id
  );

  if (!isAdmin) return notFound();

  return (
    <ProfessionalFormComponent
      barbershopId={professional.barbershopId}
      professional={{
        id: professional.id,
        name: professional.name,
        email: professional.email,
        phone: professional.phone || "",
      }}
    />
  );
};

export default EditProfessionalPage;
