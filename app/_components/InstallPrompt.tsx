
"use client";

import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showButton, setShowButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [triggeredByBooking, setTriggeredByBooking] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(ua);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;

    setIsIOS(iOS);

    // Se já está instalado, não mostra
    if (isStandalone) return;

    // Detecta se veio com sinal de instalação (query ou sessionStorage)
    const params = new URLSearchParams(window.location.search);
    const cameWithQuery = params.get("install") === "1";
    const cameWithSession = sessionStorage.getItem("showInstallAfterBooking") === "1";

    console.log("TESTE");

    // Se veio com sinal, define o gatilho
    if (cameWithQuery || cameWithSession) {
      setTriggeredByBooking(true);
      // limpa a flag para não ficar mostrando toda hora
      try {
        sessionStorage.removeItem("showInstallAfterBooking");
      } catch {}
      // remove o parâmetro da URL de forma discreta
      const url = new URL(window.location.href);
      url.searchParams.delete("install");
      window.history.replaceState({}, "", url.toString());
    }

    // Android: captura o evento nativo
    const onBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Se veio por agendamento, mostra; senão, você pode optar por não mostrar aqui.
      // Para manter simples: mostramos sempre que temos o evento
      setShowButton(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    // iOS: não tem evento → mostramos se veio por agendamento
    if (iOS && triggeredByBooking) {
      setShowButton(true);
    }

    // fallback: se não veio por agendamento, não mostramos no iOS
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, [triggeredByBooking]);

  const handleInstallClick = () => {
    if (isIOS) {
      alert(
        "Para instalar no iPhone:\n\n1) Toque no botão Compartilhar (📤)\n2) Escolha 'Adicionar à Tela de Início'"
      );
      setShowButton(false);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(() => setShowButton(false));
    } else {
      // Caso raro: não temos evento no Android (ex: não atende critérios de PWA)
      alert("Instalação não disponível agora. Verifique se seu PWA atende os requisitos.");
    }
  };

  if (!showButton) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 z-50 animate-slide-up">
      <span className="text-sm">📱 Instale o app para receber lembretes</span>
      <button
        onClick={handleInstallClick}
        className="bg-white text-black text-xs font-semibold px-3 py-1 rounded-lg"
      >
        Instalar
      </button>
    </div>
  );
}
