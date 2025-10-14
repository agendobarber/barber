// app/api/auth/[...nextauth]/route.ts
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
        });

        if (!user || !user.password) return null;

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;

        return user;
      },
    }),
  ],
  callbacks: {
    // Session callback com JWT strategy
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.sub,
        role: token.role || "user",
      } as any;
      return session;
    },
    // JWT callback para adicionar role
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || "user";
      } else {
        // Buscar do DB se não tiver user (sessão já existente)
        const dbUser = await db.user.findUnique({ where: { id: token.sub } });
        token.role = dbUser?.role || "user";
      }
      return token;
    },
    // Controla login via role
    async signIn({ user }) {
      const roleFromDb = (user as any)?.role;
      const roleFromCookie = (await cookies()).get("next-auth-role")?.value || "user";

      if (roleFromDb && roleFromDb !== roleFromCookie) {
        console.warn(
          `Login negado: ${user.email} tem role=${roleFromDb}, mas tentou entrar como ${roleFromCookie}`
        );
        throw new Error(
          `AccessDenied&expected=${roleFromDb}&tried=${roleFromCookie}`
        );
      }

      return true;
    },
    // Redirecionamento após login (credentials ou Google)
    async redirect({ url, baseUrl }) {
      // Permite que o callbackUrl que você passou seja respeitado
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  events: {
    async createUser({ user }) {
      // Pega role do cookie
      const roleFromCookie = (await cookies()).get("next-auth-role")?.value || "user";

      // Atualiza role no DB
      await db.user.update({
        where: { id: user.id },
        data: { role: roleFromCookie } as any,
      });

      // Se for admin, cria barbearia automaticamente
      if (roleFromCookie === "admin") {
        const barbershop = await db.barbershop.create({
          data: {
            name: `${user.name}'s Barbearia`,
            address: "Endereço padrão",
            phones: [],
            description: "Barbearia criada automaticamente",
            imageUrl: "/default-barbershop.png",
          },
        });

        await db.user.update({
          where: { id: user.id },
          data: { barbershopId: barbershop.id } as any,
        });
      }
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
