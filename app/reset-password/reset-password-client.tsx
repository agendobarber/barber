
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Header from "../_components/header";

const MIN_LEN = 8;

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // token/email da URL
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const email = useMemo(() => searchParams.get("email") ?? "", [searchParams]);

  // estados do formulário
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  // mensagens
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !email) {
      setError("Link inválido. Solicite uma nova redefinição de senha.");
    }
  }, [token, email]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token || !email) {
      setError("Link inválido. Solicite uma nova redefinição de senha.");
      return;
    }
    if (!password || !confirm) {
      setError("Preencha a nova senha e a confirmação.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < MIN_LEN) {
      setError(`A senha deve ter pelo menos ${MIN_LEN} caracteres.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setError(data?.message || "Não foi possível redefinir a senha.");
        return;
      }

      setSuccess("Senha redefinida com sucesso! Você já pode entrar.");
      setTimeout(() => router.push("/"), 2000); // troque para "/login" se preferir
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const strength = getStrength(password);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 p-5 md:p-10 max-w-xl mx-auto w-full">
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Redefinir senha</h1>
          <p className="text-gray-500 mt-2">
            Crie uma nova senha {email ? `para ${email}` : "para sua conta"}.
          </p>

          {error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-4">
            <label htmlFor="new-password" className="block font-semibold mb-1">
              Nova senha
            </label>
            <input
              id="new-password"
              type="password"
              placeholder="Digite a nova senha"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none"
              disabled={loading}
            />

            {/* Barra de força */}
            <div className="mt-2">
              <div
                className="h-2 rounded bg-muted overflow-hidden"
                aria-hidden="true"
              >
                <div
                  className="h-full transition-[width] duration-200"
                  style={{
                    width: `${strength.percent}%`,
                    background: strength.color,
                  }}
                />
              </div>
              <small className="text-gray-500">
                Força da senha: {strength.label} • mínimo de {MIN_LEN}{" "}
                caracteres.
              </small>
            </div>

            <label
              htmlFor="confirm-password"
              className="block font-semibold mt-4 mb-1"
            >
              Confirmar senha
            </label>
            <input
              id="confirm-password"
              type="password"
              placeholder="Repita a nova senha"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !token || !email}
              className="mt-5 w-full rounded-md bg-foreground px-4 py-2 font-bold text-background disabled:bg-gray-500"
              aria-disabled={loading || !token || !email}
            >
              {loading ? "Redefinindo..." : "Salvar"}
            </button>
          </form>

          <div className="mt-3 text-xs text-gray-500">
            Este link funciona apenas uma vez e pode expirar.
          </div>
        </section>
      </main>
    </div>
  );
}

/* -------- helpers -------- */

function getStrength(pwd: string) {
  if (!pwd) return { percent: 0, color: "#ddd", label: "vazia" };

  let score = 0;
  if (pwd.length >= MIN_LEN) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  const percent = Math.min(100, (score / 5) * 100);
  const color = percent >= 80 ? "#16a34a" : percent >= 60 ? "#f59e0b" : "#ef4444";
  const label = percent >= 80 ? "forte" : percent >= 60 ? "média" : "fraca";

  return { percent, color, label };
}
