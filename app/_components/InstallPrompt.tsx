
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

const DISMISS_DAYS = 7;

type InstallPromptProps = {
  /** Quando true, força mostrar o modal sempre (ignora instalado/silenciado/flags) */
  forceShow?: boolean;
};

export default function InstallPrompt({ forceShow = false }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);


  // dentro do InstallPrompt.tsx
  useEffect(() => {
    // tenta pegar o prompt armazenado pelo bridge
    if ((window as any).__deferredPrompt) {
      setDeferredPrompt((window as any).__deferredPrompt);
    }

    // quando o bridge avisar que ficou disponível
    const onAvailable = () => {
      setDeferredPrompt((window as any).__deferredPrompt);
      // opcional: se quiser abrir o modal assim que ficar disponível
      // setShowModal(true);
    };

    window.addEventListener("pwa-deferred-available", onAvailable);
    return () => window.removeEventListener("pwa-deferred-available", onAvailable);
  }, []);


  // Marca instalação quando rodando instalado (iOS/Android)
  useEffect(() => {
    if (isRunningStandalone()) {
      try {
        localStorage.setItem("pwaInstalled", "1");
      } catch { }
    }
  }, []);

  // Marca instalação quando Chrome finalizar (Android)
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

    // Android: captura o evento nativo — mostra quando disponível
    const handleBIP = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Se forcendo, podemos abrir modal imediatamente,
      // ou ao menos garantir que ao chegar o evento há modal.
      if (forceShow) setShowModal(true);
      else setShowModal(true); // comportamento original: mostra quando evento dispara
    };
    window.addEventListener("beforeinstallprompt", handleBIP);

    // ----- Condição de exibição -----
    if (forceShow) {
      // Ignora instalado/silenciado/flags de query/session
      // iOS: sem evento; podemos abrir o modal direto
      if (iOS) {
        setShowModal(true);
      } else {
        // Android: se o evento ainda não aconteceu, modal pode abrir,
        // mas o botão "Instalar" pode ficar desabilitado/instruir usuário.
        setShowModal(true);
      }
    } else {
      // Fluxo original
      const installed = localStorage.getItem("pwaInstalled") === "1";
      const dismissedUntil = Number(localStorage.getItem("installPromptDismissedUntil") || 0);
      const silenced = Date.now() < dismissedUntil;
      if (!(installed || silenced)) {
        const params = new URLSearchParams(window.location.search);
        const qInstall = params.get("install") === "1";
        const sInstall = sessionStorage.getItem("showInstallAfterBooking") === "1";

        if (qInstall || sInstall) {
          try {
            sessionStorage.removeItem("showInstallAfterBooking");
          } catch { }
          const url = new URL(window.location.href);
          url.searchParams.delete("install");
          window.history.replaceState({}, "", url.toString());
        }

        // iOS: se veio sinalizado (após agendamento), mostrar
        if (iOS && (qInstall || sInstall)) {
          setShowModal(true);
        }
        // Android: modal abre ao disparar o beforeinstallprompt (handleBIP)
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBIP);
    };
  }, [forceShow]);

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
    // Silenciar por X dias (somente se NÃO estiver forçando)
    try {
      if (!forceShow) {
        localStorage.setItem(
          "installPromptDismissedUntil",
          String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000)
        );
      }
    } catch { }
    setShowModal(false);
  };

  // ---- Render ----
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-5 mx-4 animate-modal-enter text-center">
        <h4 className="text-lg font-bold text-gray-900 mb-2">📱 Instale o app</h4>

        {isIOS ? (
          <>
            <h5 className="text-base font-semibold text-gray-900 mb-2">
              💈 Receba lembretes do seu horário
            </h5>
            <p className="text-sm text-gray-700 mb-4">
              Toque em <b>Compartilhar</b> do navegador →{" "}
              <b>Adicionar à Tela de Início</b> → <b>Aceite os termos</b>
            </p>

            {inApp && (
              <p className="mt-1 text-xs text-gray-500">
                Abra no <b>Safari</b> para instalar.
              </p>
            )}

            {!isSafari && !inApp && (
              <button onClick={handleOpenInSafari} className="w-full mt-2 text-sm text-gray-600 underline">
                Abrir no Safari
              </button>
            )}

            <button onClick={handleClose} className="w-full mt-3 text-sm text-gray-500">
              Agora não
            </button>
          </>
        ) : (
          <>
            <h5 className="text-base font-semibold text-gray-900 mb-2">
              💈 Receba lembretes do seu horário
            </h5>
            <p className="text-sm text-gray-700 mb-4">
              Instale para receber lembretes do seu corte.
            </p>

            <button
              onClick={handleInstallClick}
              className="w-full bg-black text-white text-sm font-semibold px-4 py-3 rounded-xl disabled:opacity-60"
              disabled={!deferredPrompt} // quando forçando, pode não haver evento ainda
              title={!deferredPrompt ? "Aguarde o navegador habilitar a instalação" : undefined}
            >
              Instalar
            </button>

            <button onClick={handleClose} className="w-full mt-2 text-sm text-gray-500">
              Agora não
            </button>
          </>
        )}
      </div>
    </div>
  );
}
