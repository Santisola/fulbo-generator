"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const wasDismissed = localStorage.getItem("pwa-install-dismissed") === "true";

    if (isStandalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Show floating button after a delay if not shown yet
    if (!wasDismissed) {
      const timer = setTimeout(() => {
        setShowFloatingButton(true);
      }, 5000);
      return () => {
        window.removeEventListener("beforeinstallprompt", handler);
        clearTimeout(timer);
      };
    }

    window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowBanner(false);
      setShowFloatingButton(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    setShowFloatingButton(true);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  const handleFloatingClick = () => {
    if (deferredPrompt) {
      handleInstall();
    } else {
      // Fallback: show instructions
      alert("Para instalar la app:\n\n• En iOS (Safari): Toca el botón de compartir y luego 'Agregar a pantalla de inicio'\n• En Android (Chrome): Busca la opción 'Instalar app' en el menú del navegador");
    }
  };

  return (
    <>
      {/* Banner - only shows when browser triggers beforeinstallprompt */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 md:bottom-4 md:left-auto md:right-4 md:w-96 md:rounded-lg bg-white dark:bg-zinc-900 shadow-lg border-t md:border border-zinc-200 dark:border-zinc-700 p-4 z-50 animate-in slide-in-from-bottom-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
                Instalar Fulbo Teams
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1 line-clamp-2">
                Agregá la app a tu pantalla de inicio para acceder rápido
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 transition-colors"
                >
                  Instalar
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 text-zinc-600 dark:text-zinc-300 text-sm font-medium hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  Ahora no
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating button - always available */}
      {showFloatingButton && !showBanner && (
        <button
          onClick={handleFloatingClick}
          className="fixed bottom-20 right-4 sm:bottom-24 sm:right-8 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg flex items-center justify-center z-40 transition-all hover:scale-110"
          aria-label="Instalar app"
        >
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      )}
    </>
  );
}
