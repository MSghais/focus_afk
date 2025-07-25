'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * InstallPrompt
 * 
 * Shows a PWA install prompt for Android/desktop (via beforeinstallprompt)
 * and iOS (shows manual instructions).
 * Hides itself if already running in standalone mode.
 */
function InstallPrompt() {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallButton, setShowInstallButton] = useState(true);
    const installButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        // Detect iOS
        setIsIOS(
            /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        );
        // Detect standalone mode (PWA already installed)
        setIsStandalone(
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true
        );

        // Listen for beforeinstallprompt (Android/desktop)
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallButton(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    // Don't show anything if already installed
    if (isStandalone) return null;

    const handleInstallClick = async () => {
        console.log('handleInstallClick', deferredPrompt);
        if (deferredPrompt) {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            setDeferredPrompt(null);
            setShowInstallButton(false);
        }
    };

    return (
        <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Install App</h3>
            {/* Android/desktop: show install button if available */}
            {showInstallButton && !isIOS && (
                <button
                    ref={installButtonRef}
                    onClick={handleInstallClick}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    Add to Home Screen
                </button>
            )}
            {/* iOS: show manual instructions */}
            {isIOS && (
                <div className="mt-2">
                    <button
                        disabled
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded cursor-not-allowed"
                        aria-disabled="true"
                    >
                        Add to Home Screen
                    </button>
                    <p className="text-sm mt-2">
                        To install this app on your iOS device, tap the{' '}
                        <span className="inline-block align-middle">
                            <svg width="18" height="18" viewBox="0 0 24 24" className="inline" aria-label="Share icon">
                                <path fill="currentColor" d="M12 16a1 1 0 0 1-1-1V7.83l-2.59 2.58a1 1 0 1 1-1.41-1.41l4.3-4.29a1 1 0 0 1 1.41 0l4.3 4.29a1 1 0 1 1-1.41 1.41L13 7.83V15a1 1 0 0 1-1 1zm-7 4a1 1 0 0 1-1-1v-2a1 1 0 1 1 2 0v1h14v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5z"/>
                            </svg>
                        </span>
                        {' '}share button and then "Add to Home Screen"
                        <span className="inline-block align-middle ml-1">
                            <svg width="18" height="18" viewBox="0 0 24 24" className="inline" aria-label="Plus icon">
                                <path fill="currentColor" d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                            </svg>
                        </span>.
                    </p>
                </div>
            )}
        </div>
    );
}

export default InstallPrompt;