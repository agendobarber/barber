
"use client";

import { useEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";

type Props = { barbershopId: string };

export default function ThemeToggleManual({ barbershopId }: Props) {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  // Aplica classe no <html>
  const applyDarkClass = (dark: boolean) => {
    document.documentElement.classList.toggle("dark", dark);
  };

  // Busca inicial: sempre converte para apenas light/dark
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/theme?barbershopId=${barbershopId}`, { cache: "no-store" });
        const data = await res.json();
        const mode = data?.mode;

        // Converte qualquer coisa para dark/light
        const dark = mode === "dark" ? true : false; // se vier 'system', força claro (ou troque para true se quiser default escuro)
        if (!mounted) return;
        setIsDark(dark);
        applyDarkClass(dark);
      } catch {
        // fallback: claro
        if (!mounted) return;
        setIsDark(false);
        applyDarkClass(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [barbershopId]);

  if (isDark === null) return null;

  const toggle = async () => {
    const next = !isDark;
    setIsDark(next);
    applyDarkClass(next);

    try {
      await fetch("/api/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barbershopId, mode: next ? "dark" : "light" }),
      });
    } catch {
      // opcional: toast de erro
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Ativar tema ${isDark ? "claro" : "escuro"}`}
      className="inline-flex items-center gap-2 rounded-md px-3 py-2
                 bg-secondary text-secondary-foreground border border-border
                 hover:bg-accent hover:text-accent-foreground transition-colors"
      title={isDark ? "Mudar para claro" : "Mudar para escuro"}
    >
      {isDark ? <FaSun className="text-yellow-500" /> : <FaMoon className="text-zinc-700" />}
    </button>
  );
}
