'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { biometricAuth } from '@/lib/biometric-auth';
import { BiometricSetup } from '@/components/mobile/BiometricSetup';
import { BiometricPrompt } from '@/components/mobile/BiometricPrompt';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { 
  User, 
  Shield, 
  Bell, 
  CreditCard, 
  Trophy,
  Settings,
  LogOut,
  ChevronRight,
  Fingerprint,
  Key,
  Smartphone
} from 'lucide-react';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('none');

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    const type = await biometricAuth.getBiometricType();
    setBiometricType(type);
    
    // Check if user has registered biometric credentials
    try {
      const response = await fetch('/api/auth/biometric/credentials');
      const data = await response.json();
      setBiometricEnabled(data.credentials?.length > 0);
    } catch (error) {
      console.error('Error checking biometric status:', error);
    }
  };

  const handleBiometricToggle = () => {
    if (biometricEnabled) {
      // Show prompt to disable
      setShowBiometricPrompt(true);
    } else {
      // Show setup flow
      setShowBiometricSetup(true);
    }
  };

  const handleDisableBiometric = async () => {
    try {
      // Get credentials and delete them
      const response = await fetch('/api/auth/biometric/credentials');
      const data = await response.json();
      
      for (const cred of data.credentials || []) {
        await fetch('/api/auth/biometric/credentials', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credentialId: cred.id })
        });
      }
      
      setBiometricEnabled(false);
    } catch (error) {
      console.error('Error disabling biometric:', error);
    }
  };

  const profileSections = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Personal Info',
          value: session?.user?.email,
          action: '/profile/edit'
        },
        {
          icon: CreditCard,
          label: 'Subscription',
          value: 'Pro Plan',
          action: '/pricing'
        },
        {
          icon: Trophy,
          label: 'Achievements',
          value: '24 unlocked',
          action: '/achievements'
        }
      ]
    },
    {
      title: 'Security',
      items: [
        {
          icon: Fingerprint,
          label: getBiometricLabel(),
          value: biometricEnabled ? 'Enabled' : 'Disabled',
          toggle: true,
          onToggle: handleBiometricToggle
        },
        {
          icon: Key,
          label: 'PIN Code',
          value: 'Set',
          action: '/security/pin'
        },
        {
          icon: Smartphone,
          label: 'Trusted Devices',
          value: '2 devices',
          action: '/security/devices'
        }
      ]
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: Bell,
          label: 'Notifications',
          value: 'All enabled',
          action: '/settings/notifications'
        },
        {
          icon: Settings,
          label: 'App Settings',
          value: '',
          action: '/settings'
        }
      ]
    }
  ];

  function getBiometricLabel() {
    switch (biometricType) {
      case 'faceId':
        return 'Face ID';
      case 'touchId':
        return 'Touch ID';
      case 'fingerprint':
        return 'Fingerprint';
      default:
        return 'Biometric Login';
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Please sign in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-800 px-4 pt-12 pb-8">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
            <User className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            {session.user.name || 'Fantasy Player'}
          </h1>
          <p className="text-blue-100">{session.user.email}</p>
        </div>
      </div>

      {/* Profile Sections */}
      <div className="px-4 py-6 space-y-6">
        {profileSections.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {section.title}
            </h2>
            <div className="bg-gray-800 rounded-xl overflow-hidden divide-y divide-gray-700">
              {section.items.map((item, index) => {
                const Icon = item.icon;
                
                return (
                  <motion.div
                    key={item.label}
                    whileTap={item.toggle ? {} : { scale: 0.98 }}
                    onClick={() => {
                      if (item.action && !item.toggle) {
                        window.location.href = item.action;
                      }
                    }}
                    className={`flex items-center justify-between p-4 ${
                      !item.toggle ? 'cursor-pointer' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-400" />
                      <span className="text-white">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.value && (
                        <span className="text-sm text-gray-400">{item.value}</span>
                      )}
                      {item.toggle ? (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={biometricEnabled}
                            onChange={item.onToggle}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Sign Out Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            // Sign out logic
            window.location.href = '/api/auth/signout';
          }}
          className="w-full bg-red-600/20 border border-red-600 text-red-500 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </motion.button>
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav />

      {/* Biometric Setup Modal */}
      {showBiometricSetup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-gray-900 rounded-2xl max-w-md w-full"
          >
            <BiometricSetup
              onComplete={() => {
                setBiometricEnabled(true);
                setShowBiometricSetup(false);
              }}
              onSkip={() => setShowBiometricSetup(false)}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Biometric Disable Prompt */}
      {showBiometricPrompt && (
        <BiometricPrompt
          reason="Authenticate to disable biometric login"
          onSuccess={() => {
            handleDisableBiometric();
            setShowBiometricPrompt(false);
          }}
          onCancel={() => setShowBiometricPrompt(false)}
        />
      )}
    </div>
  );
}