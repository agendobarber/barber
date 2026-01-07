
// app/_components/InstallNowButton.tsx
"use client";

import { useMemo } from "react";

function isIOSSafari(ua: string) {
  const low = ua.toLowerCase();
  const isIOS = /iphone|ipad|ipod/i.test(low);
  const isSafariEngine = !!(low.includes("safari") && !low.includes("crios") && !low.includes("fxios"));
  return { isIOS, isSafari: isSafariEngine };
}

export default function InstallNowButton({
  className = "px-3 py-2 bg-black text-white rounded",
  onInstalled,
  onFallback,
}: {
  className?: string;
  onInstalled?: () => void;
  onFallback?: () => void;
}) {
  const ua = useMemo(() => navigator.userAgent, []);
  const { isIOS, isSafari } = isIOSSafari(ua);

  const installAppNow = async () => {
    // evento capturado pelo PWAInstallBridge
    const dp = (window as any).__deferredPrompt;

    if (isIOS) {
      // iOS não possui beforeinstallprompt; usar share() quando possível
      if (isSafari && "share" in navigator) {
        try {
          await (navigator as any).share({
            title: "Instalar App",
            text: "Escolha 'Adicionar à Tela de Início'",
            url: window.location.href,
          });
          onInstalled?.();
        } catch {
          // instrução simples
          alert("No iPhone/iPad: toque em Compartilhar → Adicionar à Tela de Início.");
          onFallback?.();
        }
      } else {
        alert("No iPhone/iPad: toque em Compartilhar → Adicionar à Tela de Início.");
        onFallback?.();
      }
      return;
    }

    // Android/Chrome: precisa do beforeinstallprompt
    if (dp) {
      try {
        dp.prompt();
        await dp.userChoice; // aguarda escolha do usuário
        onInstalled?.();
      } catch {
        alert("Não foi possível abrir o prompt de instalação. Tente pelo menu ⋮ → Adicionar à tela inicial.");
        onFallback?.();
      }
    } else {
      // fallback quando o navegador não disponibilizou o evento ainda
      alert("No Chrome: toque no menu ⋮ → Adicionar à tela inicial.");
      onFallback?.();
    }
  };

  return (
    <button onClick={installAppNow} className={className}>
      Baixar App
    </button>
  );
}
