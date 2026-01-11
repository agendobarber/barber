
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "../_lib/auth";
import { db } from "../_lib/prisma";
import { requireRole } from "../_lib/requireRole";
import UsersListComponent from "../_components/UsersListComponent";

const UsersPage = async () => {
  await requireRole("admin"); // apenas admins acessam
  const session = await getServerSession(authOptions);

  if (!session?.user) return notFound();

  const barbershop = await db.barbershop.findFirst({
    where: {
      admins: {
        some: { id: (session.user as any).id },
      },
    },
    select: { id: true },
  });

  // Busca apenas usuários com role 'admin'
  const users = await db.user.findMany({
    where: { role: "admin" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <UsersListComponent
      users={users}
      barbershopId={barbershop?.id ?? null} // <-- importante!
    />
  );
};

export default UsersPage;
