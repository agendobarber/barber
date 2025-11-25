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

    // Busca TODOS os usuários
    const users = await db.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,       // <- ADICIONAR ISSO
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });



    return <UsersListComponent users={users} />;
};

export default UsersPage;
