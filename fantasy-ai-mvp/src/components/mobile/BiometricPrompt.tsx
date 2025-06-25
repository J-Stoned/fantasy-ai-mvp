'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { biometricAuth } from '@/lib/biometric-auth';
import { Fingerprint, Shield, Loader2 } from 'lucide-react';

interface BiometricPromptProps {
  reason?: string;
  onSuccess: () => void;
  onCancel: () => void;
  fallbackToPin?: boolean;
}

export function BiometricPrompt({
  reason = 'Authenticate to continue',
  onSuccess,
  onCancel,
  fallbackToPin = true
}: BiometricPromptProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('none');
  const [showPinFallback, setShowPinFallback] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkBiometricType();
    // Auto-start authentication
    handleAuthenticate();
  }, []);

  const checkBiometricType = async () => {
    const type = await biometricAuth.getBiometricType();
    setBiometricType(type);
  };

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    setError('');

    try {
      const result = await biometricAuth.authenticate({
        fallbackToPin: false,
        requireRecentAuth: true
      });

      if (result.success) {
        // Haptic feedback on success
        if ('vibrate' in navigator) {
          navigator.vibrate([50, 100, 50]);
        }
        onSuccess();
      } else {
        setError('Authentication failed');
        if (fallbackToPin) {
          setShowPinFallback(true);
        }
      }
    } catch (error) {
      setError('Authentication error');
      if (fallbackToPin) {
        setShowPinFallback(true);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePinSubmit = async () => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    setIsAuthenticating(true);
    try {
      // Verify PIN on backend
      const response = await fetch('/api/auth/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });

      if (response.ok) {
        onSuccess();
      } else {
        setError('Invalid PIN');
        setPin('');
      }
    } catch (error) {
      setError('Verification failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'faceId':
        return (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center"
          >
            <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none">
              <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z" fill="currentColor"/>
              <circle cx="9" cy="10" r="1.5" fill="currentColor"/>
              <circle cx="15" cy="10" r="1.5" fill="currentColor"/>
              <path d="M12 17c2 0 3.5-1.5 3.5-3.5h-7c0 2 1.5 3.5 3.5 3.5z" fill="currentColor"/>
            </svg>
          </motion.div>
        );
      case 'touchId':
      case 'fingerprint':
        return (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Fingerprint className="w-20 h-20 text-blue-600" />
          </motion.div>
        );
      default:
        return <Shield className="w-20 h-20 text-gray-600" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          {!showPinFallback ? (
            <motion.div
              key="biometric"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="mb-6 flex justify-center">
                {isAuthenticating ? (
                  <Loader2 className="w-20 h-20 animate-spin text-blue-600" />
                ) : (
                  getBiometricIcon()
                )}
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                {biometricType === 'faceId' && 'Face ID'}
                {biometricType === 'touchId' && 'Touch ID'}
                {biometricType === 'fingerprint' && 'Fingerprint'}
                {biometricType === 'none' && 'Authentication Required'}
              </h3>

              <p className="text-gray-400 mb-6">{reason}</p>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mb-4"
                >
                  {error}
                </motion.p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 bg-gray-800 text-white py-3 rounded-lg font-medium"
                  disabled={isAuthenticating}
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAuthenticate}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium"
                  disabled={isAuthenticating}
                >
                  Try Again
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="pin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <h3 className="text-xl font-bold text-white mb-2">
                Enter PIN
              </h3>

              <p className="text-gray-400 mb-6">
                Enter your PIN to continue
              </p>

              <div className="mb-6">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full bg-gray-800 text-white text-center text-2xl py-4 rounded-lg tracking-widest"
                  maxLength={6}
                  autoFocus
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mb-4"
                >
                  {error}
                </motion.p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPinFallback(false);
                    setPin('');
                    setError('');
                  }}
                  className="flex-1 bg-gray-800 text-white py-3 rounded-lg font-medium"
                  disabled={isAuthenticating}
                >
                  Use Biometric
                </button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePinSubmit}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
                  disabled={isAuthenticating || pin.length < 4}
                >
                  {isAuthenticating ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    'Submit'
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}