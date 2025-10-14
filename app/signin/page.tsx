"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/app/_components/ui/button";
import { toast } from "sonner";

export default function SignInPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const res = await signIn("credentials", {
      redirect: false,
      callbackUrl: "/",
      credentials: {
        email: form.email,
        password: form.password,
      },
    });

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Login realizado com sucesso!");
      router.push("/"); // redireciona
    }

    setIsSubmitting(false);
  };

  return (
    <div className="p-5 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Entrar</h1>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1">
          Email
          <input
            type="email"
            className="border p-2 rounded"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          Senha
          <input
            type="password"
            className="border p-2 rounded"
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
            required
          />
        </label>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
