
"use client";

import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
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

    if (cameWithQuery || cameWithSession) {
      setTriggeredByBooking(true);
      // limpa a flag para não ficar mostrando toda hora
      try {
        sessionStorage.removeItem("showInstallAfterBooking");
      } catch {}
      // remove o parâmetro da URL discretamente
      const url = new URL(window.location.href);
      url.searchParams.delete("install");
      window.history.replaceState({}, "", url.toString());
    }

    const onBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Mostra o modal ao capturar o evento (Android)
      setShowModal(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    // iOS não tem evento; se veio do agendamento, mostramos mesmo assim
    if (iOS && (cameWithQuery || cameWithSession)) {
      setShowModal(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (isIOS) {
      alert(
        "Para instalar no iPhone:\n\n1) Toque no botão Compartilhar (📤)\n2) Escolha 'Adicionar à Tela de Início'"
      );
      setShowModal(false);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(() => setShowModal(false));
    } else {
      alert("Instalação não disponível agora. Verifique requisitos do PWA (manifest, HTTPS, service worker).");
    }
  };

  const handleClose = () => {
    setShowModal(false);
    // Opcional: persistir que o usuário fechou para não mostrar de novo por um tempo
    // localStorage.setItem("installPromptDismissedAt", String(Date.now()));
  };

  if (!showModal) return null;

  return (
    // Backdrop + container central
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-5 mx-4 animate-modal-enter">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-base font-bold">📱 Instale o app</h4>
          <button
            onClick={handleClose}
            aria-label="Fechar"
            className="text-gray-500 hover:text-gray-700 transition"
          >
            ✖
          </button>
        </div>

        {/* Mensagem curta */}
        <p className="text-sm text-gray-600">
          Instale para receber lembretes do seu corte e não perder o horário.
        </p>

        {/* Ações */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-black text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            Instalar
          </button>
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-200 text-gray-900 text-sm font-semibold px-4 py-2 rounded-lg"
          >
            Agora não
          </button>
        </div>

        {/* Dica para iOS (opcional, aparece só se for iOS) */}
        {isIOS && (
          <p className="mt-3 text-[12px] text-gray-500">
            iPhone/iPad: toque em <span className="font-medium">Compartilhar (📤)</span> &rarr;{" "}
            <span className="font-medium">Adicionar à Tela de Início</span>.
          </p>
        )}
      </div>
    </div>
  );
}