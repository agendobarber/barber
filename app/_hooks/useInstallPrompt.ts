
'use client';

import { useEffect, useState, useCallback } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>;
};

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installedOnce, setInstalledOnce] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('pwaInstalled') === 'true';
  });

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault?.();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setInstalledOnce(true);
      setDeferred(null);
      try {
        window.localStorage.setItem('pwaInstalled', 'true');
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as any);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as any);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const canPrompt = !!deferred && !installedOnce;

  const triggerInstall = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    // se aceitou, alguns navegadores disparam 'appinstalled' depois
    if (choice.outcome === 'accepted') {
      try {
        window.localStorage.setItem('pwaInstalled', 'true');
      } catch {}
      setDeferred(null);
      setInstalledOnce(true);
    }
  }, [deferred]);

  return { canPrompt, triggerInstall, installedOnce };
}
