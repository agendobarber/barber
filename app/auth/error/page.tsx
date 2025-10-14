"use client";

import { Suspense } from "react";
import { Button } from "@/app/_components/ui/button";
import { useSearchParams } from "next/navigation";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const expected = searchParams.get("expected");
  const tried = searchParams.get("tried");

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 p-4 text-center">
      <h1 className="text-2xl font-bold">Acesso negado</h1>

      {error === "AccessDenied" ? (
        <p>
          Você tentou entrar como <b>{tried}</b>, mas sua conta é{" "}
          <b>{expected}</b>.
        </p>
      ) : (
        <p>Ocorreu um erro ao tentar entrar.</p>
      )}

      <Button onClick={() => (window.location.href = "/")}>Voltar</Button>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="text-center p-10">Carregando...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
