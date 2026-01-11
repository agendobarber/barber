
'use client';

import { useInstallPrompt } from '@/app/_hooks/useInstallPrompt';
import { usePWADisplayMode } from '@/app/_hooks/usePWADisplayMode';
import { useEffect, useMemo, useState } from 'react';

/* ────────────────────────────────────────────────────────────────────────────
   Ícone de Compartilhar (estilo Safari) — minimalista
   ──────────────────────────────────────────────────────────────────────────── */
function IOSShareIcon({ className = 'w-4 h-4 text-foreground' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {/* seta para cima */}
      <path
        d="M12 14V4m0 0l4 4m-4-4l-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* base quadrada */}
      <path
        d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Componente principal (minimalista Apple)
   ──────────────────────────────────────────────────────────────────────────── */
export default function InstallPWAAppleMinimal() {
  const { installed } = usePWADisplayMode();
  const { canPrompt, triggerInstall, installedOnce } = useInstallPrompt();

  // Chaves e janela de reexibição
  const LAST_DISMISS_KEY = 'pwaDismissedAt';
  const SHOW_AGAIN_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
  const SHOW_DELAY_MS = 1800; // pequeno atraso para não “pular” instantaneamente

  const [visible, setVisible] = useState(false);

  const { isIOS, isSafari, isIOSNonSafari } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { isIOS: false, isSafari: false, isIOSNonSafari: false };
    }
    const ua = window.navigator.userAgent;
    // iPad/iPhone/iPod ou iPadOS em modo desktop (MacIntel + touch)
    const isiOSUA =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);

    // Safari real (evitar Chrome/Edge/Firefox sob WebKit no iOS)
    const safariLike = /safari/i.test(ua);
    const otherEngines = /crios|fxios|edgios|opr|opios|brave/i.test(ua);
    const safari = isiOSUA && safariLike && !otherEngines;

    return {
      isIOS: isiOSUA,
      isSafari: safari,
      isIOSNonSafari: isiOSUA && !safari,
    };
  }, []);

  // Regras de exibição
  useEffect(() => {
    if (installed || installedOnce) return;

    const dismissedAt = Number(localStorage.getItem(LAST_DISMISS_KEY) || 0);
    const canShowByFrequency = Date.now() - dismissedAt > SHOW_AGAIN_AFTER_MS;
    if (!canShowByFrequency) return;

    const timer = setTimeout(() => {
      // iOS: sempre mostrar (educacional), com variação Safari vs não-Safari
      if (isIOS) {
        setVisible(true);
        return;
      }
      // Não-iOS: só se houver prompt disponível
      if (!isIOS && canPrompt) {
        setVisible(true);
      }
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [installed, installedOnce, isIOS, canPrompt]);

  function handleClose() {
    try {
      localStorage.setItem(LAST_DISMISS_KEY, String(Date.now()));
    } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="
        fixed left-3 right-3 bottom-3 z-50
        rounded-2xl border border-border/40 bg-muted/40 backdrop-blur
        shadow-lg
        p-3 md:p-4
        flex items-start gap-3
      "
      role="region"
      aria-label="Instalar aplicativo"
    >
      {/* Conteúdo */}
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">
          Adicionar à Tela de Início
        </p>

        {isSafari && (
          <p className="mt-1 text-xs text-muted-foreground">
            No Safari, toque no botão{' '}
            {/* Ícone de compartilhar com indicador de pulso em cima */}
            <span className="relative inline-flex items-center align-middle">
              <IOSShareIcon className="w-4 h-4 mr-1" />
              {/* “pulso” posicionado sobre o ícone */}
              <span
                className="
                  pointer-events-none absolute -top-1 -right-2
                  w-3 h-3 rounded-full bg-primary/40 animate-ping
                "
                aria-hidden="true"
              />
            </span>
            <strong>Compartilhar</strong> e depois{' '}
            <strong>Adicionar à Tela de Início</strong>.
          </p>
        )}

        {isIOSNonSafari && (
          <p className="mt-1 text-xs text-muted-foreground">
            Para instalar no iPhone/iPad, abra esta página no <strong>Safari</strong>.
          </p>
        )}

        {!isIOS && (
          <p className="mt-1 text-xs text-muted-foreground">
            Clique em <strong>Instalar</strong> para adicionar à sua área de trabalho.
          </p>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2">
        {!isIOS && canPrompt && (
          <button
            onClick={triggerInstall}
            className="
              inline-flex items-center justify-center
              rounded-xl bg-foreground px-4 py-2 text-background text-sm font-semibold
              hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/30
            "
            title="Instalar aplicativo"
          >
            Instalar
          </button>
        )}

        <button
          onClick={handleClose}
          className="
            inline-flex items-center justify-center
            rounded-xl px-2.5 py-2 text-xs text-muted-foreground
            hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-border/40
          "
          aria-label="Fechar aviso"
          title="Fechar"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}