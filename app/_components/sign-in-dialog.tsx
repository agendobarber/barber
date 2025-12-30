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
        }
        setShowError(true);
        return;
      }

      // Login bem-sucedido
      window.location.href = role === "admin" ? "/dashboard" : "/";
    } catch (err) {
      console.error(err);
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
        setShowError(true);
      } else {
        window.location.href = role === "admin" ? "/dashboard" : "/";
      }
    } catch (err) {
      console.error(err);
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

          <div className="mt-4">
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

        <Button
          variant="link"
          className="w-full"
          onClick={() => setIsSigningUp(!isSigningUp)}
        >
          {isSigningUp
            ? "Já tem uma conta? Entrar"
            : "Ainda não tem conta? Crie seu cadastro"}
        </Button>

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
            <Image src="/google.svg" width={18} height={18} alt="Google login" />
          )}
          {isLoading ? "Entrando..." : "Google"}
        </Button>
      </div>

      <Dialog open={showError} onOpenChange={setShowError}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erro</DialogTitle>
            <DialogDescription>
              {showMessageError}
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowError(false)}>Fechar</Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SignInDialog;
