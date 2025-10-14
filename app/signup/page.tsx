"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Header from "../_components/header";
import { Button } from "../_components/ui/button";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Erro ao cadastrar");

      toast.success("Cadastro realizado com sucesso!");
      router.push("/auth/signin");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao cadastrar");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <div className="p-5 space-y-4 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold">Criar Conta</h1>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1">
            Nome 
            <input
              type="text"
              className="border p-2 rounded"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1">
            Email
            <input
              type="email"
              required
              className="border p-2 rounded"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1">
            Senha
            <input
              type="password"
              required
              className="border p-2 rounded"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
            />
          </label>

          {/* Botão Voltar */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => router.back()} // ou router.push("/auth/signin")
          >
            Voltar
          </Button>

          {/* Botão Criar Conta */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Cadastrando..." : "Criar Conta"}
          </Button>
        </form>
      </div>
    </>
  );
}
