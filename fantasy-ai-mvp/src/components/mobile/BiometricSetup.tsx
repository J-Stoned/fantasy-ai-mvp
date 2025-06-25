'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { biometricAuth } from '@/lib/biometric-auth';
import { 
  Fingerprint, 
  Smartphone, 
  Shield, 
  Check, 
  X,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface BiometricSetupProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function BiometricSetup({ onComplete, onSkip }: BiometricSetupProps) {
  const { data: session } = useSession();
  const [step, setStep] = useState<'intro' | 'setup' | 'success' | 'error'>('intro');
  const [biometricType, setBiometricType] = useState<string>('none');
  const [isChecking, setIsChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    setIsChecking(true);
    try {
      const available = await biometricAuth.isAvailable();
      if (available) {
        const type = await biometricAuth.getBiometricType();
        setBiometricType(type);
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSetup = async () => {
    if (!session?.user) return;
    
    setStep('setup');
    try {
      // Register biometric credentials
      const userId = session.user.id || session.user.email || '';
      const username = session.user.name || session.user.email || '';
      
      const registered = await biometricAuth.register(userId, username);
      
      if (registered) {
        // Test authentication
        const result = await biometricAuth.authenticate({ requireRecentAuth: true });
        
        if (result.success) {
          setStep('success');
          setTimeout(() => {
            onComplete?.();
          }, 2000);
        } else {
          throw new Error('Authentication test failed');
        }
      } else {
        throw new Error('Registration failed');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Setup failed. Please try again.');
      setStep('error');
    }
  };

  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'faceId':
        return (
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 bg-blue-500 rounded-2xl opacity-20 animate-pulse" />
            <div className="absolute inset-2 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none">
                <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z" fill="currentColor"/>
                <circle cx="9" cy="10" r="1.5" fill="currentColor"/>
                <circle cx="15" cy="10" r="1.5" fill="currentColor"/>
                <path d="M12 17c2 0 3.5-1.5 3.5-3.5h-7c0 2 1.5 3.5 3.5 3.5z" fill="currentColor"/>
              </svg>
            </div>
          </div>
        );
      case 'touchId':
      case 'fingerprint':
        return <Fingerprint className="w-16 h-16 text-blue-600" />;
      default:
        return <Shield className="w-16 h-16 text-gray-600" />;
    }
  };

  const getBiometricName = () => {
    switch (biometricType) {
      case 'faceId':
        return 'Face ID';
      case 'touchId':
        return 'Touch ID';
      case 'fingerprint':
        return 'Fingerprint';
      default:
        return 'Biometric Authentication';
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="mb-6 inline-block"
            >
              {getBiometricIcon()}
            </motion.div>

            <h2 className="text-2xl font-bold text-white mb-3">
              {biometricType !== 'none' 
                ? `Enable ${getBiometricName()}`
                : 'Secure Your Account'
              }
            </h2>

            <p className="text-gray-400 mb-8">
              {biometricType !== 'none'
                ? `Use ${getBiometricName()} for quick and secure access to your Fantasy.AI account`
                : 'Biometric authentication is not available on this device'
              }
            </p>

            {biometricType !== 'none' ? (
              <>
                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-3 text-left">
                    <Check className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-white font-medium">Fast Login</p>
                      <p className="text-sm text-gray-400">Skip passwords with instant biometric access</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-left">
                    <Check className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-white font-medium">Enhanced Security</p>
                      <p className="text-sm text-gray-400">Your biometric data never leaves your device</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-left">
                    <Check className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-white font-medium">Trade Protection</p>
                      <p className="text-sm text-gray-400">Confirm important actions with biometric verification</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSetup}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium"
                  >
                    Enable {getBiometricName()}
                  </motion.button>
                  <button
                    onClick={onSkip}
                    className="w-full text-gray-400 py-2"
                  >
                    Maybe Later
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-400">
                    Biometric authentication is not available on this device. 
                    You can still use your password to access Fantasy.AI.
                  </p>
                </div>
                <button
                  onClick={onSkip}
                  className="w-full bg-gray-800 text-white py-3 rounded-lg font-medium"
                >
                  Continue
                </button>
              </div>
            )}
          </motion.div>
        )}

        {step === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="mb-6 inline-block"
            >
              <Loader2 className="w-16 h-16 text-blue-600" />
            </motion.div>

            <h3 className="text-xl font-bold text-white mb-3">
              Setting Up {getBiometricName()}
            </h3>

            <p className="text-gray-400">
              Follow the prompts on your device to complete setup
            </p>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="mb-6 inline-block"
            >
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            <h3 className="text-xl font-bold text-white mb-3">
              {getBiometricName()} Enabled!
            </h3>

            <p className="text-gray-400">
              You can now use {getBiometricName()} to access Fantasy.AI
            </p>
          </motion.div>
        )}

        {step === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center"
          >
            <div className="mb-6 inline-block">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-3">
              Setup Failed
            </h3>

            <p className="text-gray-400 mb-6">
              {errorMessage}
            </p>

            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep('intro')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium"
              >
                Try Again
              </motion.button>
              <button
                onClick={onSkip}
                className="w-full text-gray-400 py-2"
              >
                Skip for Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}