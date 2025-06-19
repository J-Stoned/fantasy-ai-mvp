"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { leagueConnectorService, LeaguePlatform, LeagueCredentials } from "@/lib/league-connector-service";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ExternalLink,
  Shield,
  Clock,
  Users,
  Trophy,
  Zap,
  Globe,
  Key,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";

interface LeagueImportWizardProps {
  onComplete: (connectionId: string) => void;
  onCancel: () => void;
  userId: string;
}

interface WizardStep {
  id: number;
  title: string;
  description: string;
  component: React.ReactNode;
}

export function LeagueImportWizard({ onComplete, onCancel, userId }: LeagueImportWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState<LeaguePlatform | null>(null);
  const [credentials, setCredentials] = useState<Partial<LeagueCredentials>>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [importWizard, setImportWizard] = useState<any>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const platforms = [
    {
      platform: LeaguePlatform.YAHOO,
      name: "Yahoo Fantasy",
      logo: "/platforms/yahoo.png",
      description: "Import from Yahoo Fantasy Sports leagues",
      features: ["Full roster sync", "Historical data", "Live scoring"],
      difficulty: "Easy",
      time: "2-3 minutes"
    },
    {
      platform: LeaguePlatform.ESPN,
      name: "ESPN Fantasy",
      logo: "/platforms/espn.png", 
      description: "Connect your ESPN Fantasy leagues",
      features: ["Complete league data", "Player analysis", "Matchup insights"],
      difficulty: "Medium",
      time: "3-5 minutes"
    },
    {
      platform: LeaguePlatform.SLEEPER,
      name: "Sleeper",
      logo: "/platforms/sleeper.png",
      description: "Sync with Sleeper dynasty and redraft leagues",
      features: ["Dynasty support", "Draft history", "Trade analysis"],
      difficulty: "Easy",
      time: "1-2 minutes"
    },
    {
      platform: LeaguePlatform.CBS,
      name: "CBS Sports",
      logo: "/platforms/cbs.png",
      description: "Import CBS Sports fantasy leagues",
      features: ["Keeper leagues", "Custom scoring", "Commissioner tools"],
      difficulty: "Medium",
      time: "3-4 minutes"
    }
  ];

  useEffect(() => {
    if (selectedPlatform) {
      loadImportWizard();
    }
  }, [selectedPlatform]);

  const loadImportWizard = async () => {
    if (!selectedPlatform) return;
    
    try {
      const wizard = await leagueConnectorService.createImportWizard(selectedPlatform);
      setImportWizard(wizard);
    } catch (error) {
      console.error('Failed to load import wizard:', error);
    }
  };

  const handlePlatformSelect = (platform: LeaguePlatform) => {
    setSelectedPlatform(platform);
    setCredentials({ platform, leagueId: '' });
    setCurrentStep(1);
  };

  const handleConnect = async () => {
    if (!selectedPlatform || !credentials.leagueId) return;
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      const connection = await leagueConnectorService.connectLeague(
        userId,
        selectedPlatform,
        credentials as LeagueCredentials
      );
      
      onComplete(connection.id);
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const steps: WizardStep[] = [
    {
      id: 0,
      title: "Choose Platform",
      description: "Select your fantasy platform to import leagues",
      component: (
        <div className="space-y-4">
          {platforms.map((platform) => (
            <motion.div
              key={platform.platform}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <GlassCard 
                className={`p-6 cursor-pointer transition-all border-2 ${
                  selectedPlatform === platform.platform 
                    ? 'border-neon-blue bg-neon-blue/10' 
                    : 'border-white/10 hover:border-neon-blue/50'
                }`}
                onClick={() => handlePlatformSelect(platform.platform)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-neon-blue" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">{platform.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {platform.time}
                      </div>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-3">{platform.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {platform.features.map((feature, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 text-xs bg-neon-blue/20 text-neon-blue rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        platform.difficulty === 'Easy' 
                          ? 'bg-neon-green/20 text-neon-green'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {platform.difficulty} Setup
                      </span>
                      
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )
    },
    {
      id: 1,
      title: "Enter Details",
      description: "Provide your league information",
      component: (
        <div className="space-y-6">
          {importWizard && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {platforms.find(p => p.platform === selectedPlatform)?.name} Import
              </h3>
              
              <div className="space-y-4">
                {importWizard.steps.map((step: any, index: number) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-neon-blue text-white' : 'bg-white/10 text-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{step.title}</h4>
                      <p className="text-sm text-gray-400">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-neon-green" />
                  <span className="text-gray-300">Requirements:</span>
                </div>
                <ul className="mt-2 text-xs text-gray-400 list-disc list-inside">
                  {importWizard.requirements.map((req: string, index: number) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                League ID
              </label>
              <input
                type="text"
                value={credentials.leagueId || ''}
                onChange={(e) => setCredentials({ ...credentials, leagueId: e.target.value })}
                placeholder="Enter your league ID"
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue"
              />
            </div>
            
            {selectedPlatform === LeaguePlatform.ESPN && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Season Year
                </label>
                <input
                  type="number"
                  value={credentials.username || new Date().getFullYear()}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  placeholder="2024"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue"
                />
              </div>
            )}
            
            {(selectedPlatform === LeaguePlatform.YAHOO || selectedPlatform === LeaguePlatform.CBS) && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={credentials.username || ''}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    placeholder="Your username"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={credentials.password || ''}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    placeholder="Your password"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue"
                  />
                </div>
              </>
            )}
          </div>
          
          {connectionError && (
            <div className="flex items-start gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-300 font-medium">Connection Failed</p>
                <p className="text-xs text-red-400 mt-1">{connectionError}</p>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 2,
      title: "Connecting",
      description: "Importing your league data",
      component: (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-neon-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-neon-blue animate-spin" />
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-2">Connecting to your league...</h3>
          <p className="text-gray-400 text-sm mb-6">This may take a few moments</p>
          
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-neon-green" />
              <span className="text-gray-300">Validating credentials</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 text-neon-blue animate-spin" />
              <span className="text-gray-300">Importing league data</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 border border-gray-600 rounded-full" />
              <span className="text-gray-500">Syncing rosters and matchups</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-2xl"
      >
        <GlassCard className="overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neon-blue/20 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-neon-blue" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Import League</h2>
                  <p className="text-sm text-gray-400">Connect your existing fantasy league</p>
                </div>
              </div>
              
              <button
                onClick={onCancel}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                disabled={isConnecting}
              >
                <ExternalLink className="w-4 h-4 text-gray-400 rotate-45" />
              </button>
            </div>
            
            {/* Progress indicator */}
            <div className="flex items-center gap-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    index <= currentStep 
                      ? 'bg-neon-blue text-white' 
                      : 'bg-white/10 text-gray-400'
                  }`}>
                    {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 transition-colors ${
                      index < currentStep ? 'bg-neon-blue' : 'bg-white/10'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-lg font-semibold text-white mb-2">
                  {steps[currentStep].title}
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                  {steps[currentStep].description}
                </p>
                
                {steps[currentStep].component}
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-white/10 flex items-center justify-between">
            <div className="flex gap-2">
              {currentStep > 0 && !isConnecting && (
                <NeonButton
                  variant="purple"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </NeonButton>
              )}
            </div>
            
            <div className="flex gap-2">
              {currentStep === 0 && (
                <NeonButton
                  variant="purple"
                  onClick={onCancel}
                >
                  Cancel
                </NeonButton>
              )}
              
              {currentStep === 1 && (
                <NeonButton
                  variant="blue"
                  onClick={handleConnect}
                  disabled={!credentials.leagueId || isConnecting}
                  className="flex items-center gap-2"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Connect League
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </NeonButton>
              )}
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

export default LeagueImportWizard;