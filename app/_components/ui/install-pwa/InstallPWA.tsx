
'use client';

import { useInstallPrompt } from '@/app/_hooks/useInstallPrompt';
import { usePWADisplayMode } from '@/app/_hooks/usePWADisplayMode';
import { useEffect, useMemo, useState } from 'react';

/* ────────────────────────────────────────────────────────────────────────────
   Ícones minimalistas (estilo Apple) em SVG
   ──────────────────────────────────────────────────────────────────────────── */
function IOSShareIcon({ className = 'w-5 h-5 text-foreground' }) {
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

function AddToHomeIcon({ className = 'w-5 h-5 text-foreground' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 10.5 12 4l8 6.5v7a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M12 11.5v6M9 14.5h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* Linha de passos ultra-curta com ícones */
function MiniSteps() {
  return (
    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
      <div className="inline-flex items-center gap-1.5">
        <IOSShareIcon className="w-4 h-4" />
        <span>Compartilhar</span>
      </div>
      <span aria-hidden="true">→</span>
      <div className="inline-flex items-center gap-1.5">
        <AddToHomeIcon className="w-4 h-4" />
        <span>Adicionar à Tela de Início</span>
      </div>
    </div>
  );
}

/* Popover que aponta para a barra inferior do Safari (botão compartilhar) */
function SafariPointer() {
  return (
    <div
      className="
        pointer-events-none fixed bottom-14 left-1/2 -translate-x-1/2
        flex flex-col items-center text-[11px] text-muted-foreground
      "
      aria-hidden="true"
    >
      <div
        className="
          rounded-full bg-background/90 px-3 py-1 shadow-sm border border-border/40
          backdrop-blur-sm
        "
      >
        Toque no botão <strong>Compartilhar</strong> ⬆️
      </div>
      {/* seta para baixo */}
      <svg
        className="mt-1 w-5 h-5 text-muted-foreground animate-bounce"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 5v14m0 0l-6-6m6 6l6-6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      {/* pulso/círculo */}
      <div className="mt-1 w-4 h-4 rounded-full bg-primary/30 animate-ping" />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Componente principal (minimalista Apple)
   ──────────────────────────────────────────────────────────────────────────── */
export default function InstallPWAApple() {
  const { installed } = usePWADisplayMode();
  const { canPrompt, triggerInstall, installedOnce } = useInstallPrompt();

  // Chaves e janela de reexibição
  const LAST_DISMISS_KEY = 'pwaDismissedAt';
  const SHOW_AGAIN_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

  const [visible, setVisible] = useState(false);

  const { isIOS, isSafari, isIOSNonSafari } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { isIOS: false, isSafari: false, isIOSNonSafari: false };
    }
    const ua = window.navigator.userAgent;
    const isiOSUA = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const safariLike = /safari/i.test(ua);
    const otherEngines = /crios|fxios|edgios|opr|opios|brave/i.test(ua);
    const safari = isiOSUA && safariLike && !otherEngines;
    return {
      isIOS: isiOSUA,
      isSafari: safari,
      isIOSNonSafari: isiOSUA && !safari,
    };
  }, []);

  // Regra de exibição:
  // - Se já instalado ou já instalou uma vez, não mostra
  // - Em iOS Safari: mostra (educacional)
  // - Em iOS NÃO-Safari: mostra aviso "Abra no Safari"
  // - Em não-iOS: só mostra se houver prompt
  useEffect(() => {
    if (installed || installedOnce) return;

    const dismissedAt = Number(localStorage.getItem(LAST_DISMISS_KEY) || 0);
    const canShowByFrequency = Date.now() - dismissedAt > SHOW_AGAIN_AFTER_MS;

    if (!canShowByFrequency) return;

    if (isIOS) {
      setVisible(true);
      return;
    }

    if (!isIOS && canPrompt) {
      setVisible(true);
      return;
    }
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
          <>
            <p className="mt-1 text-xs text-muted-foreground">
              No Safari, toque no botão{' '}
              <strong>Compartilhar</strong>{' '}
              <span className="inline-flex align-middle">
                <IOSShareIcon className="w-3.5 h-3.5 ml-0.5" />
              </span>{' '}
              e depois <strong>Adicionar à Tela de Início</strong>.
            </p>
            <MiniSteps />
            {/* Ponteiro indicando a barra inferior do Safari */}
            <SafariPointer />
          </>
        )}

        {isIOSNonSafari && (
          <>
            <p className="mt-1 text-xs text-muted-foreground">
              Para instalar no iPhone/iPad, abra esta página no{' '}
              <strong>Safari</strong>.
            </p>
            <div className="mt-2 text-[11px] text-muted-foreground">
              Dica: no Chrome/Edge, toque em <strong>Compartilhar</strong> e selecione{' '}
              <strong>“Abrir no Safari”</strong>.
            </div>
          </>
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
