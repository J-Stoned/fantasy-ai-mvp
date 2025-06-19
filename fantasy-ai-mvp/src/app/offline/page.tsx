"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { 
  WifiOff, 
  RefreshCw, 
  Smartphone, 
  Zap,
  Activity
} from "lucide-react";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background cyber-grid flex items-center justify-center p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-neon-red/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard className="p-8 text-center">
            {/* Offline Icon */}
            <motion.div
              className="w-20 h-20 mx-auto mb-6 bg-neon-red/20 rounded-full flex items-center justify-center"
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity 
              }}
            >
              <WifiOff className="w-10 h-10 text-neon-red" />
            </motion.div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-white mb-4">
              You're Offline
            </h1>

            {/* Description */}
            <p className="text-gray-400 mb-6 leading-relaxed">
              No internet connection detected. Don't worry - Fantasy.AI works offline too! 
              Your lineup changes are saved locally and will sync when you're back online.
            </p>

            {/* Offline Features */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="w-2 h-2 bg-neon-green rounded-full" />
                <span>View cached lineups and players</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="w-2 h-2 bg-neon-green rounded-full" />
                <span>Make lineup changes (saved locally)</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="w-2 h-2 bg-neon-green rounded-full" />
                <span>Access AI analysis and insights</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="w-2 h-2 bg-neon-yellow rounded-full" />
                <span>Live scores resume when online</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <NeonButton
                variant="blue"
                onClick={handleRetry}
                className="w-full flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </NeonButton>
              
              <NeonButton
                variant="purple"
                onClick={handleGoHome}
                className="w-full flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                Go to Dashboard
              </NeonButton>
            </div>

            {/* Status Indicator */}
            <motion.div 
              className="mt-6 pt-4 border-t border-white/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Activity className="w-3 h-3" />
                <span>Fantasy.AI PWA • Offline Mode</span>
              </div>
            </motion.div>
          </GlassCard>
        </motion.div>

        {/* Connection Status */}
        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neon-red/20 rounded-full border border-neon-red/30">
            <div className="w-2 h-2 bg-neon-red rounded-full animate-pulse" />
            <span className="text-xs text-neon-red font-medium">
              Connection Lost
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}