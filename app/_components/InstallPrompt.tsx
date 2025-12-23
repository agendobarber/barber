
"use client";

import { useEffect, useMemo, useState } from "react";

function isIOSSafari(ua: string) {
  // iOS devices
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  // Safari (não Chrome/Edge/Firefox em iOS, nem webviews)
  // "CriOS" => Chrome iOS, "FxiOS" => Firefox iOS
  const isSafariEngine = !!(ua.includes("safari") && !ua.includes("crios") && !ua.includes("fxios"));
  return isIOS && isSafariEngine;
}

function isInAppBrowser(ua: string) {
  // Principais webviews que quebram instalação
  return /FBAN|FBAV|Instagram|Line\/|WhatsApp|Twitter|LinkedIn|Pinterest|WeChat|Snapchat/i.test(ua);
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [cameFromBooking, setCameFromBooking] = useState(false);

  // --------- init
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;

    const iOS = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(iOS);
    setIsSafari(isIOSSafari(ua));

    if (standalone) return; // já instalado

    const params = new URLSearchParams(window.location.search);
    const qInstall = params.get("install") === "1";
    const sInstall = sessionStorage.getItem("showInstallAfterBooking") === "1";
    if (qInstall || sInstall) {
      setCameFromBooking(true);
      try { sessionStorage.removeItem("showInstallAfterBooking"); } catch {}
      const url = new URL(window.location.href);
      url.searchParams.delete("install");
      window.history.replaceState({}, "", url.toString());
    }

    const handleBIP = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowModal(true);
    };
    window.addEventListener("beforeinstallprompt", handleBIP);

    // iOS não tem evento; se veio do agendamento, mostramos
    if (iOS && (qInstall || sInstall)) setShowModal(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBIP);
    };
  }, []);

  const ua = useMemo(() => navigator.userAgent, []);
  const inApp = useMemo(() => isInAppBrowser(ua), [ua]);

  // --------- actions
  const handleInstallClick = async () => {
    // iOS: manter minimalista
    if (isIOS) {
      // Se estiver no Safari, tentamos abrir o share (às vezes aparece "Adicionar à Tela de Início")
      if (isSafari && "share" in navigator) {
        try {
          await (navigator as any).share({
            title: "Instalar App",
            text: "Escolha 'Adicionar à Tela de Início'",
            url: window.location.href,
          });
        } catch {
          // silencioso — a instrução curta permanece visível
        }
      }
      // Se não for Safari, não adianta tentar share — deixamos a instrução na tela
      return;
    }

    // Android: fluxo nativo
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(() => setShowModal(false));
    }
  };

  const handleOpenInSafari = () => {
    // Tenta abrir no Safari (quando está em webview, às vezes cai no mesmo contexto)
    // Melhor prática: orientar o usuário a tocar no ícone "Abrir no Safari" na barra inferior/superior.
    window.location.href = window.location.href; // força reload no mesmo URL
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-5 mx-4 animate-modal-enter text-center">
        <h4 className="text-lg font-bold mb-2">📱 Instale o app</h4>

        {/* Mensagem minimalista */}
        {isIOS ? (
          <>
            <p className="text-sm text-gray-700 mb-4">
              Toque em <b>Compartilhar</b> do navegador → <b>Adicionar à Tela de Início</b>.
            </p>

            {/* Se estiver em webview (Instagram/WhatsApp/etc.), avise de forma curtíssima */}
            {inApp && (
              <p className="mt-3 text-xs text-gray-500">
                Abra no <b>Safari</b> para instalar.
              </p>
            )}

            {/* Se não for Safari, ofereça um toque de ação simples */}
            {!isSafari && !inApp && (
              <button
                onClick={handleOpenInSafari}
                className="w-full mt-2 text-sm text-gray-600 underline"
              >
                Abrir no Safari
              </button>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-2 text-sm text-gray-500"
            >
              Agora não
            </button>
          </>
        ) : (
          <>
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
