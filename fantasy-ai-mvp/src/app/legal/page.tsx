"use client";

/**
 * 🏛️ LEGAL DOCUMENTS PAGE
 * 
 * Displays all legal documents and compliance information to ensure transparency
 * and legal compliance for users in all jurisdictions.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { SafeModeIndicator } from "@/components/compliance/ComplianceWrapper";
import { LEGAL_DOCUMENTS, LegalComplianceManager, type LegalDocument } from "@/lib/legal-compliance";
import { COMPLIANCE } from "@/lib/feature-flags";
import { 
  Shield, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Download,
  Eye,
  Calendar,
  Globe,
  Scale,
  Lock,
  User,
  MapPin
} from "lucide-react";

export default function LegalPage() {
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);
  const [showComplianceAudit, setShowComplianceAudit] = useState(false);
  
  const complianceAudit = LegalComplianceManager.generateComplianceAudit();
  const isSafeMode = COMPLIANCE.isSafeMode();

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'terms_of_service': return <FileText className="w-5 h-5" />;
      case 'privacy_policy': return <User className="w-5 h-5" />;
      case 'gambling_disclaimer': return <AlertTriangle className="w-5 h-5" />;
      case 'subscription_terms': return <Scale className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getDocumentColor = (type: string) => {
    switch (type) {
      case 'terms_of_service': return 'neon-blue';
      case 'privacy_policy': return 'neon-green';
      case 'gambling_disclaimer': return 'neon-red';
      case 'subscription_terms': return 'neon-purple';
      default: return 'neon-gray';
    }
  };

  return (
    <div className="min-h-screen bg-background cyber-grid p-6">
      <SafeModeIndicator />
      
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Scale className="w-8 h-8 text-neon-blue" />
            <h1 className="text-4xl font-bold neon-text">Legal Center</h1>
          </div>
          <p className="text-gray-400">
            Transparency and compliance documentation for Fantasy.AI users
          </p>
        </motion.div>

        {/* Compliance Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <GlassCard className={`p-6 border-2 ${isSafeMode ? 'border-green-500/30 bg-green-900/10' : 'border-red-500/30 bg-red-900/10'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isSafeMode ? (
                  <Shield className="w-8 h-8 text-green-400" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                )}
                <div>
                  <h2 className={`text-xl font-bold ${isSafeMode ? 'text-green-400' : 'text-red-400'}`}>
                    {isSafeMode ? '🛡️ Safe Mode Active' : '⚠️ Gambling Features Enabled'}
                  </h2>
                  <p className="text-gray-300">
                    {isSafeMode 
                      ? 'All gambling features are disabled. Only legal fantasy sports features are available.'
                      : 'Some gambling features may be enabled. Please check your local laws.'
                    }
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-3xl font-bold ${isSafeMode ? 'text-green-400' : 'text-red-400'}`}>
                  {complianceAudit.complianceScore}%
                </div>
                <p className="text-sm text-gray-400">Compliance Score</p>
              </div>
            </div>
            
            {complianceAudit.recommendations.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <h4 className="text-yellow-400 font-semibold mb-2">Compliance Recommendations:</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  {complianceAudit.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-yellow-400 rounded-full" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </GlassCard>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Legal Documents List */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold neon-text mb-6">Legal Documents</h2>
              
              <div className="space-y-4">
                {LEGAL_DOCUMENTS.filter(doc => doc.isActive).map((document, index) => (
                  <motion.div
                    key={document.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <div 
                      className="hover:glow-sm transition-all duration-300 cursor-pointer"
                      onClick={() => setSelectedDocument(document)}
                    >
                      <GlassCard>
                        <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`text-${getDocumentColor(document.type)} glow-sm`}>
                            {getDocumentIcon(document.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{document.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                v{document.version}
                              </span>
                              <span className="flex items-center gap-1">
                                <Globe className="w-4 h-4" />
                                {document.jurisdictions.join(', ')}
                              </span>
                              {document.requiredForSignup && (
                                <span className="flex items-center gap-1 text-neon-yellow">
                                  <Lock className="w-4 h-4" />
                                  Required
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <NeonButton 
                            size="sm" 
                            variant="blue"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDocument(document);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </NeonButton>
                        </div>
                        </div>
                      </GlassCard>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Compliance Info Sidebar */}
          <div className="space-y-6">
            {/* Quick Compliance Check */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-neon-green" />
                  Compliance Status
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Safe Mode</span>
                    <span className={isSafeMode ? 'text-green-400' : 'text-red-400'}>
                      {isSafeMode ? '✅ Active' : '❌ Disabled'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Legal Documents</span>
                    <span className="text-neon-blue">
                      {LEGAL_DOCUMENTS.filter(d => d.isActive).length} Active
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Gambling Features</span>
                    <span className={complianceAudit.enabledGamblingFeatures.length === 0 ? 'text-green-400' : 'text-red-400'}>
                      {complianceAudit.enabledGamblingFeatures.length === 0 ? '✅ Disabled' : `❌ ${complianceAudit.enabledGamblingFeatures.length} Enabled`}
                    </span>
                  </div>
                </div>
                
                <NeonButton 
                  variant="purple" 
                  className="w-full mt-4"
                  onClick={() => setShowComplianceAudit(!showComplianceAudit)}
                >
                  {showComplianceAudit ? 'Hide' : 'Show'} Full Audit
                </NeonButton>
              </GlassCard>
            </motion.div>

            {/* Jurisdiction Support */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <GlassCard>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-neon-purple" />
                  Supported Regions
                </h3>
                
                <div className="space-y-2 text-sm">
                  {complianceAudit.supportedJurisdictions.slice(0, 6).map((jurisdiction, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-neon-green rounded-full" />
                      <span className="text-gray-300">{jurisdiction}</span>
                    </div>
                  ))}
                  {complianceAudit.supportedJurisdictions.length > 6 && (
                    <div className="text-gray-400">
                      + {complianceAudit.supportedJurisdictions.length - 6} more regions
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <GlassCard>
                <h3 className="text-lg font-semibold mb-4">Legal Contact</h3>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-400">Legal Questions:</p>
                    <p className="text-neon-blue">legal@fantasy-ai.com</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400">Compliance Issues:</p>
                    <p className="text-neon-green">compliance@fantasy-ai.com</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400">Privacy Concerns:</p>
                    <p className="text-neon-purple">privacy@fantasy-ai.com</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>

        {/* Full Compliance Audit */}
        {showComplianceAudit && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold mb-6">Full Compliance Audit</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-neon-blue mb-3">System Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Audit Time:</span>
                      <span className="text-gray-300">{new Date(complianceAudit.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Safe Mode:</span>
                      <span className={complianceAudit.safeMode ? 'text-green-400' : 'text-red-400'}>
                        {complianceAudit.safeMode ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Compliance Score:</span>
                      <span className="text-neon-yellow">{complianceAudit.complianceScore}%</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-neon-purple mb-3">Feature Status</h4>
                  <div className="space-y-2 text-sm">
                    {complianceAudit.enabledGamblingFeatures.length > 0 ? (
                      <>
                        <p className="text-red-400">⚠️ Gambling Features Enabled:</p>
                        {complianceAudit.enabledGamblingFeatures.map((feature, index) => (
                          <div key={index} className="ml-4 text-red-300">• {feature}</div>
                        ))}
                      </>
                    ) : (
                      <p className="text-green-400">✅ All gambling features disabled</p>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Document Viewer Modal */}
        {selectedDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedDocument(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-background border border-white/10 rounded-xl max-w-4xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`text-${getDocumentColor(selectedDocument.type)}`}>
                      {getDocumentIcon(selectedDocument.type)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{selectedDocument.title}</h3>
                      <p className="text-sm text-gray-400">
                        Version {selectedDocument.version} • Updated {selectedDocument.lastUpdated.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <NeonButton 
                    variant="pink" 
                    onClick={() => setSelectedDocument(null)}
                  >
                    ✕
                  </NeonButton>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed">
                    {selectedDocument.content}
                  </pre>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}