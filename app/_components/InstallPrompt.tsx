
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
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;

    setIsIOS(iOS);

    if (standalone) return;

    // Detecta se veio da criação de agendamento
    const params = new URLSearchParams(window.location.search);
    const cameWithQuery = params.get("install") === "1";
    const cameWithSession =
      sessionStorage.getItem("showInstallAfterBooking") === "1";

    if (cameWithQuery || cameWithSession) {
      setTriggeredByBooking(true);
      try {
        sessionStorage.removeItem("showInstallAfterBooking");
      } catch {}
      const url = new URL(window.location.href);
      url.searchParams.delete("install");
      window.history.replaceState({}, "", url.toString());
    }

    // Android
    const onBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowModal(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    // iOS não tem evento → mostramos se veio do agendamento
    if (iOS && (cameWithQuery || cameWithSession)) {
      setShowModal(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeinstallprompt);
    };
  }, []);

  const onBeforeinstallprompt = () => {};

  const handleInstallClick = async () => {
    // iOS → abre o share sheet
    if (isIOS) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: "Instalar App",
            text: "Toque em 'Adicionar à Tela de Início'",
            url: window.location.href,
          });
        } catch {}
      }
      return;
    }

    // Android → chama o prompt real
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(() => setShowModal(false));
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-5 mx-4 animate-modal-enter text-center">
        
        <h4 className="text-lg font-bold mb-2">📱 Instale o app</h4>

        <p className="text-sm text-gray-600 mb-4">
          Toque em <b>Instalar</b> e depois em <b>Adicionar à Tela de Início</b>.
        </p>

        <button
          onClick={handleInstallClick}
          className="w-full bg-black text-white text-sm font-semibold px-4 py-3 rounded-xl"
        >
          Instalar
        </button>

        <button
          onClick={() => setShowModal(false)}
          className="w-full mt-2 text-sm text-gray-500"
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
