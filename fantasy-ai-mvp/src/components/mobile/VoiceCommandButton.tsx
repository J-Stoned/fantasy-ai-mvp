'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X } from 'lucide-react';
import { EnhancedVoiceAssistant } from './EnhancedVoiceAssistant';

interface VoiceCommandButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showPulse?: boolean;
}

export function VoiceCommandButton({ 
  position = 'bottom-right',
  showPulse = true
}: VoiceCommandButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Check if user has used voice before
    const hasUsedVoice = localStorage.getItem('has_used_voice');
    setHasInteracted(!!hasUsedVoice);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setHasInteracted(true);
    localStorage.setItem('has_used_voice', 'true');
  };

  const positionClasses = {
    'bottom-right': 'bottom-24 right-4',
    'bottom-left': 'bottom-24 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        className={`fixed ${positionClasses[position]} z-40`}
      >
        {/* Pulse animation for first-time users */}
        {showPulse && !hasInteracted && (
          <motion.div
            className="absolute inset-0 bg-blue-500 rounded-full"
            animate={{
              scale: [1, 1.5, 1.5],
              opacity: [0.5, 0, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1
            }}
          />
        )}

        {/* Tooltip for first-time users */}
        <AnimatePresence>
          {!hasInteracted && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: 2 }}
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap"
            >
              <div className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg">
                <p className="font-medium">Try voice commands!</p>
                <p className="text-xs text-gray-400">Say "Hey Fantasy"</p>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                  <div className="border-8 border-transparent border-l-gray-800" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
          onClick={handleOpen}
          className="relative w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg flex items-center justify-center group"
        >
          <Mic className="w-6 h-6 text-white" />
          
          {/* Hover effect */}
          <motion.div
            className="absolute inset-0 bg-white rounded-full opacity-0 group-hover:opacity-20"
            initial={false}
            whileHover={{ scale: 1.2 }}
          />
        </motion.button>

        {/* Voice activity indicator */}
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity
          }}
        />
      </motion.div>

      {/* Voice Assistant Modal */}
      <AnimatePresence>
        {isOpen && (
          <EnhancedVoiceAssistant
            onClose={() => setIsOpen(false)}
            autoStart={true}
          />
        )}
      </AnimatePresence>
    </>
  );
}