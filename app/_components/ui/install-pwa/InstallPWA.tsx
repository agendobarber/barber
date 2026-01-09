
'use client';

import { useInstallPrompt } from '@/app/_hooks/useInstallPrompt';
import { usePWADisplayMode } from '@/app/_hooks/usePWADisplayMode';
import { useMemo } from 'react';
// Se estiver usando o hook de apps relacionados, você pode manter (opcional)
// import { useRelatedAppsInstalled } from '../../_hooks/useRelatedAppsInstalled';

function IOSSteps() {
  return (
    <ol className="mt-2 text-xs leading-relaxed text-muted-foreground list-decimal list-inside">
      <li>Toque no botão <strong>Compartilhar</strong> do Safari.</li>
      <li>Escolha <strong>Adicionar à Tela de Início</strong>.</li>
      <li>Confirme para instalar.</li>
    </ol>
  );
}

export default function InstallPWA() {
  const { installed } = usePWADisplayMode();
  const { canPrompt, triggerInstall, installedOnce } = useInstallPrompt();
  // const relatedInstalled = useRelatedAppsInstalled(); // opcional

  const isIOS = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua);
  }, []);

  // 1) Se já está instalado (display-mode ≠ browser), não mostra.
  // 2) Se já instalou alguma vez (localStorage), não mostra.
  // 3) Se NÃO for iOS e NÃO houver prompt disponível, não mostra.
  // 4) (Opcional) Se API indicar PWA relacionada instalada, não mostra.
  if (installed || installedOnce /* || relatedInstalled */) return null;
  if (!isIOS && !canPrompt) return null;

  return (
    <div
      className="
        fixed left-3 right-3 bottom-3 z-50
        rounded-xl border border-border/40 bg-muted/30 backdrop-blur
        shadow-lg p-3 md:p-4
        flex items-center gap-3 md:gap-4
      "
      role="region"
      aria-label="Instalar aplicativo"
    >
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">
          Instale o app para uma experiência melhor
        </p>

        {isIOS ? (
          <>
            <p className="text-xs text-muted-foreground mt-1">
              No iPhone, toque em <strong>Compartilhar</strong> → <strong>Adicionar à Tela de Início</strong>.
            </p>
            <IOSSteps />
          </>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">
            Clique em <strong>Instalar</strong> para adicionar à sua área de trabalho ou tela inicial.
          </p>
        )}
      </div>

      {/* Botão só em plataformas com prompt disponível (não-iOS) */}
      {!isIOS && canPrompt && (
        <button
          onClick={triggerInstall}
          className="
            inline-flex items-center justify-center
            rounded-lg bg-primary px-4 py-2 text-white text-sm font-semibold
            hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40
          "
          title="Instalar aplicativo"
        >
          Instalar
        </button>
      )}
    </div>
  );
}
