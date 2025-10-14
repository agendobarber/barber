// app/_lib/requireRole.ts
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";

export async function requireRole(requiredRole: "admin" | "user") {
  const session = await getServerSession(authOptions);

  // Se não estiver logado
  if (!session) {
    redirect("/");
  }

  const role = (session.user as any)?.role;

  // Se o role não bate com o esperado
  if (role !== requiredRole) {
    // Redireciona para a home do usuário correto
    if (role === "admin") redirect("/dashboard");
    else redirect("/"); // usuário normal tenta acessar admin
  }

  return session;
}
