
'use client';

import { useEffect, useState } from 'react';

export type PWADisplayMode =
  | 'browser'
  | 'standalone'
  | 'minimal-ui'
  | 'fullscreen'
  | 'window-controls-overlay'
  | 'twa'
  | 'unknown';

function getPWADisplayMode(): PWADisplayMode {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 'unknown';

  // TWA (Android) abre com referrer "android-app://"
  if (document.referrer.startsWith('android-app://')) return 'twa';

  // Media queries padronizadas
  if (window.matchMedia('(display-mode: browser)').matches) return 'browser';
  if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone';
  if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui';
  if (window.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen';
  if (window.matchMedia('(display-mode: window-controls-overlay)').matches) return 'window-controls-overlay';

  // iOS: detecção de “Add to Home Screen”
  // navigator.standalone = true quando roda fora do Safari
  // (Safari não dispara appinstalled) — usamos como fallback.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = (window.navigator as any);
  if (nav && typeof nav.standalone === 'boolean' && nav.standalone) return 'standalone';

  return 'unknown';
}

export function usePWADisplayMode() {
  const [mode, setMode] = useState<PWADisplayMode>('unknown');

  useEffect(() => {
    setMode(getPWADisplayMode());

    // Reage a mudanças (ex.: janela muda display-mode)
    const queries = [
      '(display-mode: browser)',
      '(display-mode: standalone)',
      '(display-mode: minimal-ui)',
      '(display-mode: fullscreen)',
      '(display-mode: window-controls-overlay)',
    ];

    const mqls = queries.map(q => window.matchMedia(q));
    const handler = () => setMode(getPWADisplayMode());
    mqls.forEach(mql => mql.addEventListener?.('change', handler));

    return () => mqls.forEach(mql => mql.removeEventListener?.('change', handler));
  }, []);

  const installed = mode !== 'browser' && mode !== 'unknown';

  return { mode, installed };
}