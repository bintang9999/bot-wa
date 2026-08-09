import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Cek apakah sudah installed (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Cek iOS
    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    setIsIos(ios);

    // Tampilkan banner iOS setelah 2 detik (tidak ada install prompt di iOS)
    if (ios) {
      const dismissed = sessionStorage.getItem('pwa-ios-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 2000);
      }
      return;
    }

    // Android / Desktop: tangkap event beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const dismissed = sessionStorage.getItem('pwa-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 2000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem(isIos ? 'pwa-ios-dismissed' : 'pwa-dismissed', '1');
  };

  if (isInstalled || !showBanner) return null;

  return (
    <div
      className="fixed bottom-[68px] left-3 right-3 md:bottom-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-up"
      role="alert"
    >
      <div className="glass-premium rounded-2xl p-4 border border-indigo-500/20 shadow-[0_8px_32px_rgba(99,102,241,0.2)]">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <img
            src="/icon-192.png"
            alt="Keuanganku"
            className="w-12 h-12 rounded-xl flex-shrink-0 shadow-lg"
          />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-tight">
              Install Keuanganku
            </p>
            {isIos ? (
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Tap <span className="font-bold text-zinc-300">Share</span> lalu{' '}
                <span className="font-bold text-zinc-300">"Add to Home Screen"</span> untuk install.
              </p>
            ) : (
              <p className="text-xs text-zinc-400 mt-1">
                Install sebagai app di HP kamu
              </p>
            )}
          </div>

          {/* Close */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-all"
            aria-label="Tutup"
          >
            <X size={14} />
          </button>
        </div>

        {/* Install button (Android/Desktop only) */}
        {!isIos && (
          <button
            id="btn-install-pwa"
            onClick={handleInstall}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white text-sm font-bold transition-all active:scale-95 shadow-[0_4px_15px_rgba(99,102,241,0.4)]"
          >
            <Download size={15} />
            Install Sekarang
          </button>
        )}
      </div>
    </div>
  );
}
