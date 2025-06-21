"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { NeonButton } from "./NeonButton";
import { 
  Smartphone, 
  Download, 
  X, 
  Zap, 
  Wifi,
  Bell
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay to not be intrusive
      setTimeout(() => {
        setShowPrompt(true);
      }, 10000); // 10 seconds after page load
    };

    // Listen for app installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      
      // Show success message
      console.log('🎉 Fantasy.AI installed successfully!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log('Install prompt result:', outcome);
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if already installed or dismissed this session
  if (isInstalled || sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && deferredPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-4 left-4 right-4 z-[9999] sm:left-auto sm:right-4 sm:w-96"
        >
          <GlassCard className="p-4 border-neon-blue/50 shadow-neon-blue/20 shadow-lg">
            <div className="flex items-start gap-3">
              {/* App Icon */}
              <div className="w-12 h-12 bg-gradient-to-br from-neon-blue to-neon-purple rounded-xl flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white mb-1">
                  Install Fantasy.AI
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  Get the full app experience with offline support, push notifications, and faster loading.
                </p>

                {/* Features */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-8 h-8 bg-neon-green/20 rounded-lg flex items-center justify-center mb-1">
                      <Wifi className="w-4 h-4 text-neon-green" />
                    </div>
                    <span className="text-xs text-gray-400">Offline</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-8 h-8 bg-neon-yellow/20 rounded-lg flex items-center justify-center mb-1">
                      <Bell className="w-4 h-4 text-neon-yellow" />
                    </div>
                    <span className="text-xs text-gray-400">Alerts</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-8 h-8 bg-neon-purple/20 rounded-lg flex items-center justify-center mb-1">
                      <Zap className="w-4 h-4 text-neon-purple" />
                    </div>
                    <span className="text-xs text-gray-400">Faster</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <NeonButton
                    size="sm"
                    variant="blue"
                    onClick={handleInstall}
                    className="flex-1 text-xs"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Install
                  </NeonButton>
                  <button
                    onClick={handleDismiss}
                    className="px-3 py-1 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PWAInstallPrompt;