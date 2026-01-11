
"use client";

import Header from "@/app/_components/header"; // ajuste o path se necessário
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/app/_components/ui/button"; // ajuste o path se necessário
import { toast } from "sonner";

// ------------------------------
// Wrapper da Página
// ------------------------------
const NewUserPage = () => {
    return (
        <>
            <Header />
            {/* Envolva a parte que usa useSearchParams com Suspense */}
            <Suspense fallback={<div className="p-5 max-w-xl mx-auto">Carregando...</div>}>
                <NewUserForm />
            </Suspense>
        </>
    );
};

export default NewUserPage;

// ------------------------------
// Formulário (usa useSearchParams)
// ------------------------------
interface UserForm {
    name: string;
    email: string;
    password: string;
}

const NewUserForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Lê barbershopId da query string: /users/new?barbershopId=ABC
    const barbershopId = useMemo(() => {
        const id = searchParams.get("barbershopId");
        return id && id.trim().length > 0 ? id : null;
    }, [searchParams]);

    const [form, setForm] = useState<UserForm>({
        name: "",
        email: "",
        password: "",
    });

    const [isSaving, setIsSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (field: keyof UserForm, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
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
        // Validação simples de email
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
        if (!emailOk) {
            toast.error("Email inválido.");
            return false;
        }

        if (!form.password.trim()) {
            toast.error("Informe a senha.");
            return false;
        }
        if (form.password.length < 8) {
            toast.error("A senha deve ter pelo menos 8 caracteres.");
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setIsSaving(true);
        try {
            const payload: Record<string, any> = {
                name: form.name,
                email: form.email,
                password: form.password, // a API fará o hash
                role: "admin", // fixo
                status: 1, // fixo (ativo)
            };

            // Inclui barbershopId se presente na URL
            if (barbershopId) {
                payload.barbershopId = barbershopId;
            }

            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                const msg =
                    data?.error ||
                    data?.message ||
                    "Erro ao criar usuário";
                throw new Error(msg);
            }

            toast.success("Usuário criado com sucesso!");
            router.push("/users");
        } catch (err: any) {
            console.error(err);
            toast.error(err?.message || "Erro ao criar usuário");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-5 space-y-4 max-w-xl mx-auto">
            <h1 className="text-2xl font-bold">Novo Usuário</h1>

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
                Senha
                <div className="flex items-center gap-2">
                    <input
                        type={showPassword ? "text" : "password"}
                        className="border p-2 rounded w-full"
                        value={form.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        placeholder="Mínimo 8 caracteres"
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

            <div className="flex gap-2 mt-4">
                <Button onClick={handleSubmit} disabled={isSaving}>
                    {isSaving ? "Salvando..." : "Salvar"}
                </Button>
                <Button variant="secondary" onClick={() => router.push("/users")}>
                    Voltar
                </Button>
            </div>
        </div>
    );
};
