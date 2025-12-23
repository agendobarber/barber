
"use client";

import { useEffect, useMemo, useState } from "react";

function isIOSSafari(ua: string) {
  // Dispositivo iOS
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  // Safari (não Chrome/Firefox em iOS, nem webviews)
  // "CriOS" => Chrome iOS, "FxiOS" => Firefox iOS
  const isSafariEngine = !!(ua.includes("safari") && !ua.includes("crios") && !ua.includes("fxios"));
  return isIOS && isSafariEngine;
}

function isInAppBrowser(ua: string) {
  // Principais webviews que não oferecem "Adicionar à Tela de Início"
  return /FBAN|FBAV|Instagram|Line\/|WhatsApp|Twitter|LinkedIn|Pinterest|WeChat|Snapchat/i.test(ua);
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;

    const iOS = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(iOS);
    setIsSafari(isIOSSafari(ua));

    // Se já está instalado, não mostra
    if (standalone) return;

    // Detecta sinal para mostrar (após agendamento)
    const params = new URLSearchParams(window.location.search);
    const qInstall = params.get("install") === "1";
    const sInstall = sessionStorage.getItem("showInstallAfterBooking") === "1";

    if (qInstall || sInstall) {
      try {
        sessionStorage.removeItem("showInstallAfterBooking");
      } catch {}
      // Limpa a query da URL
      const url = new URL(window.location.href);
      url.searchParams.delete("install");
      window.history.replaceState({}, "", url.toString());
    }

    // Android: captura o evento nativo
    const handleBIP = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowModal(true);
    };
    window.addEventListener("beforeinstallprompt", handleBIP);

    // iOS: não tem evento; se veio do agendamento, mostra
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
    // iOS: manter minimalista — abrir share no Safari (às vezes ajuda)
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
    // Tenta abrir no Safari (em alguns webviews não muda o contexto)
    window.location.href = window.location.href;
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-5 mx-4 animate-modal-enter text-center">
        {/* Título principal do modal */}
        <h4 className="text-lg font-bold mb-2">📱 Instale o app</h4>

        {isIOS ? (
          <>
            {/* Mini título de benefício — induz a instalar */}
            <h5 className="text-base font-semibold text-gray-900 mb-2">
              💈 Receba lembretes do seu horário
            </h5>

            {/* Frase curta e prática */}
            <p className="text-sm text-gray-700 mb-4">
              Toque em <b>Compartilhar</b> do navegador →{" "}
              <b>Adicionar à Tela de Início</b>.
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
              onClick={() => setShowModal(false)}
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
              onClick={() => setShowModal(false)}
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
