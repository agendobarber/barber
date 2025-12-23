
"use client";

import { useEffect, useMemo, useState } from "react";

function isIOSSafari(ua: string) {
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isSafariEngine = !!(ua.includes("safari") && !ua.includes("crios") && !ua.includes("fxios"));
  return isIOS && isSafariEngine;
}

function isInAppBrowser(ua: string) {
  return /FBAN|FBAV|Instagram|Line\/|WhatsApp|Twitter|LinkedIn|Pinterest|WeChat|Snapchat/i.test(ua);
}

function isRunningStandalone(): boolean {
  const standaloneDisplay = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = (window.navigator as any).standalone === true;
  return standaloneDisplay || iosStandalone;
}

const DISMISS_DAYS = 7; // ajuste conforme desejar

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  // Marcar instalação quando rodando instalado (iOS/Android)
  useEffect(() => {
    if (isRunningStandalone()) {
      try {
        localStorage.setItem("pwaInstalled", "1");
      } catch { }
    }
  }, []);

  // Marcar instalação quando Chrome finalizar (Android)
  useEffect(() => {
    const onAppInstalled = () => {
      try {
        localStorage.setItem("pwaInstalled", "1");
      } catch { }
      setShowModal(false);
    };
    window.addEventListener("appinstalled", onAppInstalled);
    return () => window.removeEventListener("appinstalled", onAppInstalled);
  }, []);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(iOS);
    setIsSafari(isIOSSafari(ua));

    // Se já instalado ou silenciado, não mostra
    const installed = localStorage.getItem("pwaInstalled") === "1";
    const dismissedUntil = Number(localStorage.getItem("installPromptDismissedUntil") || 0);
    const silenced = Date.now() < dismissedUntil;
    if (installed || silenced) {
      return;
    }

    // Sinalização via query/sessão (após agendar)
    const params = new URLSearchParams(window.location.search);
    const qInstall = params.get("install") === "1";
    const sInstall = sessionStorage.getItem("showInstallAfterBooking") === "1";

    // Sempre que consumir a flag, limpar para evitar reaparecer
    if (qInstall || sInstall) {
      try {
        sessionStorage.removeItem("showInstallAfterBooking");
      } catch { }
      const url = new URL(window.location.href);
      url.searchParams.delete("install");
      window.history.replaceState({}, "", url.toString());
    }

    // Android: captura o evento nativo — mostra quando disponível
    const handleBIP = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowModal(true);
    };
    window.addEventListener("beforeinstallprompt", handleBIP);

    // iOS: sem evento; se veio sinalizado (após agendamento), mostrar
    if (iOS && (qInstall || sInstall)) {
      setShowModal(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBIP);
    };
  }, []);

  const ua = useMemo(() => navigator.userAgent, []);
  const inApp = useMemo(() => isInAppBrowser(ua), [ua]);

  // Ações
  const handleInstallClick = async () => {
    // iOS: manter minimalista — opcionalmente abrir share no Safari
    if (isIOS) {
      if (isSafari && "share" in navigator) {
        try {
          await (navigator as any).share({
            title: "Instalar App",
            text: "Escolha 'Adicionar à Tela de Início'",
            url: window.location.href,
          });
        } catch {
          // usuário cancelou — segue instrução no texto
        }
      }
      return;
    }

    // Android: fluxo nativo
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(() => setShowModal(false));
    }
  };

  const handleOpenInSafari = () => {
    window.location.href = window.location.href;
  };

  const handleClose = () => {
    // Silenciar por X dias
    try {
      localStorage.setItem(
        "installPromptDismissedUntil",
        String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000)
      );
    } catch { }
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-5 mx-4 animate-modal-enter text-center">
        {/* Título principal do modal */}
        <h4 className="text-lg font-bold text-gray-900 mb-2">📱 Instale o app</h4>

        {isIOS ? (
          <>
            {/* Mini título de benefício — induz a instalar */}
            <h5 className="text-base font-semibold text-gray-900 mb-2">
              💈 Receba lembretes do seu horário
            </h5>

            {/* Frase curta e prática */}
            <p className="text-sm text-gray-700 mb-4">
              Toque em <b>Compartilhar</b> do navegador →{" "}
              <b>Adicionar à Tela de Início</b> → <b>Aceite os termos</b>
            </p>

            {/* Aviso curto se estiver em webview */}
            {inApp && (
              <p className="mt-1 text-xs text-gray-500">
                Abra no <b>Safari</b> para instalar.
              </p>
            )}

            {/* Ação opcional para tentar abrir no Safari (fora do Safari e sem ser webview) */}
            {!isSafari && !inApp && (
              <button
                onClick={handleOpenInSafari}
                className="w-full mt-2 text-sm text-gray-600 underline"
              >
                Abrir no Safari
              </button>
            )}

            {/* Botão fechar */}
            <button
              onClick={handleClose}
              className="w-full mt-3 text-sm text-gray-500"
            >
              Agora não
            </button>
          </>
        ) : (
          <>
            {/* Android: benefício + botão instalar */}
            <h5 className="text-base font-semibold text-gray-900 mb-2">
              💈 Receba lembretes do seu horário
            </h5>

            <p className="text-sm text-gray-700 mb-4">
              Instale para receber lembretes do seu corte.
            </p>

            <button
              onClick={handleInstallClick}
              className="w-full bg-black text-white text-sm font-semibold px-4 py-3 rounded-xl"
            >
              Instalar
            </button>

            <button
              onClick={handleClose}
              className="w-full mt-2 text-sm text-gray-500"
            >
              Agora não
            </button>
          </>
        )}
      </div>
    </div>
  );
}
