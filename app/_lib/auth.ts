
// app/_lib/auth.ts (ajuste o path conforme seu projeto)
import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/app/_lib/prisma";
import { compare } from "bcryptjs";
import { cookies } from "next/headers";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    // Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // Credentials
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            status: true,
          },
        });

        // Não encontrado ou sem senha
        if (!user || !user.password) return null;

        // 🔒 Bloqueia se inativo
        if (user.status !== 1) {
          const err: any = new Error("InactiveAccount");
          err.name = "InactiveAccount";
          throw err; // fará com que res.error = "InactiveAccount" no client
        }

        const ok = await compare(credentials.password, user.password);
        if (!ok) return null;

        // Retorna o objeto user; será usado em callbacks
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        } as any;
      },
    }),
  ],

  callbacks: {
    // 🔒 Bloqueia OAuth/Google para usuários inativos
    async signIn({ user }) {
      // role via cookie (sua regra atual)
      const roleFromDb = (user as any)?.role;
      const roleFromCookie = (await cookies()).get("next-auth-role")?.value || "user";

      if (roleFromDb && roleFromDb !== roleFromCookie) {
        console.warn(
          `Login negado: ${user.email} tem role=${roleFromDb}, mas tentou entrar como ${roleFromCookie}`
        );
        throw new Error(`AccessDenied&expected=${roleFromDb}&tried=${roleFromCookie}`);
      }

      // Checa status para todos os providers
      // Se for credentials, 'user' já veio com status do authorize
      // Para OAuth, precisamos buscar no DB
      let status: number | undefined = (user as any)?.status;
      if (status === undefined && user?.email) {
        const dbUser = await db.user.findUnique({
          where: { email: user.email as string },
          select: { status: true },
        });
        status = dbUser?.status;
      }

      if (status !== undefined && status !== 1) {
        // Retornar false aqui bloqueia o login OAuth
        return false;
      }

      return true;
    },

    // Session callback com JWT strategy
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.sub,
        role: (token as any).role || "user",
        status: (token as any).status ?? 1, // expõe status na sessão (opcional)
      } as any;
      return session;
    },

    // JWT callback para adicionar role/status
    async jwt({ token, user }) {
      if (user) {
        // user vem do authorize (credentials) OU do adapter (oauth)
        (token as any).role = (user as any).role || (token as any).role || "user";
        (token as any).status = (user as any).status ?? (token as any).status ?? 1;
      } else {
        // Sessão existente: garante que role/status do DB estão atualizados
        const dbUser = token.sub
          ? await db.user.findUnique({
            where: { id: token.sub as string },
            select: { role: true, status: true },
          })
          : null;

        (token as any).role = dbUser?.role || (token as any).role || "user";
        (token as any).status = dbUser?.status ?? (token as any).status ?? 1;
      }
      return token;
    },

    // Redirecionamento após login (credentials ou Google)
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },

  events: {
    async createUser({ user }) {
      // Pega role do cookie (para novos usuários)
      //const roleFromCookie = (await cookies()).get("next-auth-role")?.value || "user";
      if (user?.email) {
        const roleFromCookie = "user";

        // Atualiza role no DB (sua regra existente)
        await db.user.update({
          where: { id: user.id },
          data: { role: roleFromCookie } as any,
        });
      }
      // Se quiser criar barbearia automática para admin, seu bloco comentado segue podendo ser ativado
    },
  },

  pages: {
    error: "/auth/error",
    signIn: "/auth/signin",
  },

  session: {
    strategy: "jwt",
  },
};
