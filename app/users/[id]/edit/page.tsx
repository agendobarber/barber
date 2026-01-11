
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/app/_components/header"; // ajuste o path se necessário
import { Button } from "@/app/_components/ui/button"; // ajuste o path se necessário
import { toast } from "sonner";

// ------------------------------
// Wrapper com Suspense (exige por causa do useParams)
// ------------------------------
const EditUserPage = () => {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="p-5 max-w-xl mx-auto">Carregando...</div>}>
        <EditUserForm />
      </Suspense>
    </>
  );
};

export default EditUserPage;

// ------------------------------
// Form de edição
// ------------------------------
interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: number; // 1 = ativo, 0 = inativo
  createdAt: string | Date;
}

interface FormState {
  name: string;
  email: string;
  password: string; // opcional no update
  status: number; // manter aqui p/ possível edição
}

const EditUserForm = () => {
  const router = useRouter();
  const params = useParams();

  // Lê o :id da rota /users/[id]/edit
  const userId = useMemo(() => {
    const pid = params?.id;
    if (!pid || typeof pid !== "string") return null;
    return pid;
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    status: 1,
  });

  // Carrega dados do usuário
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;

      try {
        const res = await fetch(`/api/users/${userId}`, { method: "GET" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message || "Falha ao carregar usuário");
        }
        const data: UserData = await res.json();

        setForm({
          name: data.name ?? "",
          email: data.email,
          password: "", // vazio por padrão (somente se quiser trocar)
          status: typeof data.status === "number" ? data.status : 1,
        });
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message || "Erro ao carregar usuário");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleChange = (field: keyof FormState, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value as any }));
  };

  const validate = () => {
    if (!form.name.trim()) {
      toast.error("Informe o nome.");
      return false;
    }
    if (!form.email.trim()) {
      toast.error("Informe o email.");
      return false;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    if (!emailOk) {
      toast.error("Email inválido.");
      return false;
    }
    // Senha é opcional na edição; se preencher, valida
    if (form.password && form.password.length > 0 && form.password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate() || !userId) return;

    setSubmitting(true);
    try {
      // Monta payload: envia senha somente se preenchida
      const payload: Record<string, any> = {
        name: form.name,
        email: form.email,
        status: form.status,
      };
      if (form.password && form.password.length > 0) {
        payload.password = form.password;
      }

      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error || data?.message || "Erro ao salvar usuário";
        throw new Error(msg);
      }

      toast.success("Usuário atualizado com sucesso!");
      router.push("/users");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erro ao salvar usuário");
    } finally {
      setSubmitting(false);
    }
  };

  if (!userId) {
    return (
      <div className="p-5 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold">Editar Usuário</h1>
        <p className="text-red-400 mt-2">ID do usuário inválido.</p>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => router.push("/users")}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-5 max-w-xl mx-auto">Carregando usuário...</div>;
  }

  return (
    <div className="p-5 space-y-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">Editar Usuário</h1>

      <label className="flex flex-col gap-1">
        Nome
        <input
          className="border p-2 rounded"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Ex.: Maria Silva"
        />
      </label>

      <label className="flex flex-col gap-1">
        Email
        <input
          type="email"
          className="border p-2 rounded"
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="exemplo@dominio.com"
        />
      </label>

      <label className="flex flex-col gap-1">
        Senha (opcional)
        <div className="flex items-center gap-2">
          <input
            type={showPassword ? "text" : "password"}
            className="border p-2 rounded w-full"
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
            placeholder="Preencha apenas se quiser alterar (mínimo 8)"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            title={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </Button>
        </div>
      </label>

      {/* Status opcional (se quiser editar por aqui também) */}
      <div className="flex flex-col gap-1">
        <span>Status</span>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="status"
              value={1}
              checked={form.status === 1}
              onChange={() => handleChange("status", 1)}
            />
            Ativo
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="status"
              value={0}
              checked={form.status === 0}
              onChange={() => handleChange("status", 0)}
            />
            Inativo
          </label>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Salvando..." : "Salvar"}
        </Button>
        <Button variant="secondary" onClick={() => router.push("/users")}>
          Voltar
        </Button>
      </div>
    </div>
  );
};
