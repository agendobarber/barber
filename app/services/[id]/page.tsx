import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";
import EditServiceForm from "@/app/_components/editServiceFormComponent";

const EditServicePage = async ({ params }: any) => {
  if (!params?.id) return notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user) return notFound();

  const service = await db.barbershopService.findUnique({
    where: { id: params.id },
    include: { barbershop: { include: { admins: true } } },
  });

  if (!service) return notFound();

  const isAdmin = service.barbershop.admins.some(
    (admin: any) => admin.id === (session.user as any).id
  );
  if (!isAdmin) return notFound();

  return (
    <EditServiceForm
      service={{
        ...service,
        price: service.price.toString(), // Decimal → string
      }}
    />
  );
};

export default EditServicePage;
