
"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Dialog,
  DialogContent,
} from "./ui/dialog";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

interface SignInDialogProps {
  role?: "user" | "admin";
}

const SignInDialog = ({ role = "user" }: SignInDialogProps) => {
  const [showError, setShowError] = useState(false);
  const [showMessageError, setShowMessageError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });

  // ====== Esqueci minha senha ======
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage(null);

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Não foi possível enviar o e-mail de recuperação.");
      }

      setForgotMessage(
        "Se o e-mail existir no sistema, você receberá instruções para redefinir sua senha."
      );
    } catch (err: any) {
      setForgotMessage(err?.message || "Erro ao enviar recuperação de senha.");
    } finally {
      setForgotLoading(false);
    }
  };

  // ------------------------
  // Login com Google
  // ------------------------
  const handleLoginWithGoogle = async () => {
    setIsLoading(true);
    try {
      document.cookie = `next-auth-role=${role}; path=/`;

      await signIn("google", {
        callbackUrl: `${window.location.origin}${role === "admin" ? "/dashboard" : "/"}`,
      });
    } catch (error) {
      console.error(error);
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------
  // Login com credentials
  // ------------------------
  const handleLoginWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      document.cookie = `next-auth-role=${role}; path=/`;

      const res = await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password,
        callbackUrl: `${window.location.origin}${role === "admin" ? "/dashboard" : "/"}`,
      });

      if (res?.error) {
        if (res.error === "CredentialsSignin") {
          setShowMessageError("Usuário ou senha incorretos");
          console.warn("⚠️ Usuário ou senha incorretos");
        } else {
          console.error("Erro ao fazer login:", res.error);
          setShowMessageError("Erro ao fazer login. Tente novamente.");
        }
        setShowError(true);
        return;
      }

      // Login bem-sucedido
      window.location.href = role === "admin" ? "/dashboard" : "/";
    } catch (err) {
      console.error(err);
      setShowMessageError("Erro inesperado. Tente novamente.");
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------
  // Cadastro e login automático
  // ------------------------
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Cria usuário no backend
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao cadastrar");

      // Login automático após cadastro
      document.cookie = `next-auth-role=${role}; path=/`;

      const loginRes = await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password,
        callbackUrl: `${window.location.origin}${role === "admin" ? "/dashboard" : "/"}`,
      });

      if (loginRes?.error) {
        console.error("CredentialsSignin after signup", loginRes.error);
        setShowMessageError("Erro ao entrar após cadastro. Tente novamente.");
        setShowError(true);
      } else {
        window.location.href = role === "admin" ? "/dashboard" : "/";
      }
    } catch (err: any) {
      console.error(err);
      setShowMessageError(err?.message || "Erro ao cadastrar. Tente novamente.");
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Conecte-se à plataforma</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <form
          onSubmit={isSigningUp ? handleSignup : handleLoginWithEmail}
          className="space-y-4"
        >
          {isSigningUp && (
            <label className="flex flex-col gap-1">
              Nome
              <input
                type="text"
                className="border p-2 rounded"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
          )}

          <label className="flex flex-col gap-1">
            Email
            <input
              type="email"
              required
              className="border p-2 rounded"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>

          <label className="flex flex-col gap-2">
            Senha
            <input
              type="password"
              required
              className="border p-2 rounded"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>

          {/* Link "Esqueci minha senha" – aparece somente no modo ENTRAR */}
          {!isSigningUp && (
            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs text-primary hover:opacity-80 underline underline-offset-4"
                onClick={() => {
                  setForgotOpen(true);
                  setForgotEmail(form.email || "");
                  setForgotMessage(null);
                }}
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          <div className="mt-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? isSigningUp
                  ? "Cadastrando..."
                  : "Entrando..."
                : isSigningUp
                  ? "Criar Conta"
                  : "Entrar"}
            </Button>
          </div>
        </form>


        {
          role !== "admin" ? (

            <Button
              variant="link"
              className="w-full"
              onClick={() => setIsSigningUp(!isSigningUp)}
            >
              {isSigningUp
                ? "Já tem uma conta? Entrar"
                : "Ainda não tem conta? Crie seu cadastro"}
            </Button>

          ) : <></>
        }

        <div className="flex items-center gap-2 my-2 w-full">
          <div className="flex-1 h-px bg-muted" />
          <span className="text-xs text-muted-foreground">OU</span>
          <div className="flex-1 h-px bg-muted" />
        </div>

        <Button
          variant="outline"
          className="gap-1 font-bold w-full"
          onClick={handleLoginWithGoogle}
          disabled={isLoading}
        >


          {isLoading ? (
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
          ) : (
            <span className="sr-only">Login com Google</span>
          )}


          {isLoading ? "Entrando..." : "Google"}
        </Button>
      </div>

      {/* Dialog de erro genérico */}
      <Dialog open={showError} onOpenChange={setShowError}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erro</DialogTitle>
            <DialogDescription>
              {showMessageError || "Ocorreu um erro. Tente novamente."}
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowError(false)}>Fechar</Button>
        </DialogContent>
      </Dialog>

      {/* Dialog de "Esqueci minha senha" */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="w-[90%] max-w-md">
          <DialogHeader>
            <DialogTitle>Recuperar senha</DialogTitle>
            <DialogDescription>
              Informe seu e-mail para receber o link de redefinição.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleForgotSubmit} className="space-y-3">
            <label className="flex flex-col gap-1">
              Email
              <input
                type="email"
                required
                className="border p-2 rounded"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </label>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={forgotLoading}>
                {forgotLoading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Enviando...
                  </>
                ) : (
                  "Enviar"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setForgotOpen(false)}
              >
                Cancelar
              </Button>
            </div>

            {forgotMessage && (
              <p className="text-xs text-muted-foreground">{forgotMessage}</p>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SignInDialog;
