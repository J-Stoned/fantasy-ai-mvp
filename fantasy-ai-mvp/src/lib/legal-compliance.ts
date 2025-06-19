/**
 * 🏛️ FANTASY AI MVP - LEGAL COMPLIANCE SYSTEM
 * 
 * This system manages all legal documents, compliance checks, and regulatory requirements
 * to ensure we remain legally compliant while building toward gambling licenses.
 */

import { COMPLIANCE } from './feature-flags';

// =============================================================================
// 📋 LEGAL DOCUMENT TYPES
// =============================================================================

export interface LegalDocument {
  id: string;
  type: 'terms_of_service' | 'privacy_policy' | 'gambling_disclaimer' | 'subscription_terms' | 'age_verification' | 'compliance_notice';
  title: string;
  content: string;
  version: string;
  effectiveDate: Date;
  lastUpdated: Date;
  isActive: boolean;
  requiredForSignup: boolean;
  jurisdictions: string[]; // e.g., ['US', 'CA', 'UK']
}

export interface ComplianceCheck {
  id: string;
  type: 'age_verification' | 'jurisdiction_check' | 'feature_access' | 'gambling_prohibition';
  status: 'pending' | 'passed' | 'failed' | 'not_required';
  userId?: string;
  timestamp: Date;
  details: Record<string, any>;
}

export interface JurisdictionRules {
  country: string;
  state?: string;
  gamblingLegal: boolean;
  fantasyLegal: boolean;
  minimumAge: number;
  requiredLicenses: string[];
  prohibitedFeatures: string[];
  complianceNotes: string;
}

// =============================================================================
// 🌍 JURISDICTION COMPLIANCE DATABASE
// =============================================================================

export const JURISDICTION_RULES: JurisdictionRules[] = [
  {
    country: 'US',
    state: 'CA',
    gamblingLegal: true,
    fantasyLegal: true,
    minimumAge: 21,
    requiredLicenses: ['California Gambling Control Commission'],
    prohibitedFeatures: [],
    complianceNotes: 'Fantasy sports legal, online gambling regulated'
  },
  {
    country: 'US',
    state: 'NY',
    gamblingLegal: true,
    fantasyLegal: true,
    minimumAge: 18,
    requiredLicenses: ['New York State Gaming Commission'],
    prohibitedFeatures: [],
    complianceNotes: 'Both fantasy and gambling legal with proper licensing'
  },
  {
    country: 'US',
    state: 'UT',
    gamblingLegal: false,
    fantasyLegal: false,
    minimumAge: 18,
    requiredLicenses: [],
    prohibitedFeatures: ['WAGERING_ENABLED', 'LIVE_BETTING', 'PROP_BETTING', 'CRYPTO_PAYMENTS'],
    complianceNotes: 'All gambling and fantasy sports prohibited'
  },
  {
    country: 'US',
    state: 'TX',
    gamblingLegal: false,
    fantasyLegal: true,
    minimumAge: 18,
    requiredLicenses: [],
    prohibitedFeatures: ['WAGERING_ENABLED', 'LIVE_BETTING', 'PROP_BETTING', 'CRYPTO_PAYMENTS'],
    complianceNotes: 'Fantasy sports legal, gambling prohibited'
  },
  {
    country: 'UK',
    gamblingLegal: true,
    fantasyLegal: true,
    minimumAge: 18,
    requiredLicenses: ['UK Gambling Commission'],
    prohibitedFeatures: [],
    complianceNotes: 'Both legal with UKGC license'
  },
  {
    country: 'CA',
    gamblingLegal: true,
    fantasyLegal: true,
    minimumAge: 18,
    requiredLicenses: ['Provincial Gaming Authority'],
    prohibitedFeatures: [],
    complianceNotes: 'Regulated by provincial authorities'
  }
];

// =============================================================================
// 📜 LEGAL DOCUMENT TEMPLATES
// =============================================================================

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    id: 'terms_of_service_v1',
    type: 'terms_of_service',
    title: 'Terms of Service - Fantasy Sports Only',
    content: `
# Fantasy.AI Terms of Service

**Effective Date:** ${new Date().toISOString().split('T')[0]}
**Version:** 1.0 (Safe Mode)

## 1. ACCEPTANCE OF TERMS

By accessing Fantasy.AI ("Service"), you agree to these Terms of Service. Our service currently operates in SAFE MODE, providing only legal fantasy sports features.

## 2. FANTASY SPORTS ONLY

**IMPORTANT:** This service currently provides ONLY fantasy sports features. No gambling, wagering, or betting functionality is available. All gambling features are disabled pending proper licensing.

## 3. ELIGIBILITY

- You must be at least 18 years old
- You must be legally allowed to participate in fantasy sports in your jurisdiction
- You must provide accurate registration information

## 4. PERMITTED ACTIVITIES

You may use our service for:
- Fantasy sports league management
- AI-powered player analytics
- Social features and league communication
- Premium analytics and insights
- Subscription-based enhanced features

## 5. PROHIBITED ACTIVITIES

You may NOT use our service for:
- Any form of gambling or wagering
- Monetary betting between users
- Cryptocurrency transactions related to sports
- Any activity prohibited in your jurisdiction

## 6. SUBSCRIPTION SERVICES

Our legal revenue model includes:
- Monthly/annual subscription tiers
- Premium AI analytics features
- Advanced social features
- API access for developers

## 7. DATA AND PRIVACY

We collect and use data in accordance with our Privacy Policy. All user data is protected and never shared with gambling-related services.

## 8. COMPLIANCE COMMITMENT

We are committed to legal compliance and will:
- Never enable gambling features without proper licenses
- Respect all jurisdictional restrictions
- Provide transparent feature controls
- Maintain audit trails for compliance

## 9. LIMITATION OF LIABILITY

Fantasy.AI provides fantasy sports services only. We are not responsible for:
- Any gambling-related activities (we don't provide them)
- Third-party fantasy sports platforms
- User-to-user transactions outside our platform

## 10. MODIFICATIONS

We may update these terms as we add legally compliant features. Users will be notified of material changes.

## 11. CONTACT

Legal questions: legal@fantasy-ai.com
Compliance concerns: compliance@fantasy-ai.com

---
*This service operates in compliance with all applicable laws and regulations.*
    `,
    version: '1.0',
    effectiveDate: new Date(),
    lastUpdated: new Date(),
    isActive: true,
    requiredForSignup: true,
    jurisdictions: ['US', 'CA', 'UK', 'AU']
  },
  {
    id: 'privacy_policy_v1',
    type: 'privacy_policy',
    title: 'Privacy Policy - GDPR Compliant',
    content: `
# Fantasy.AI Privacy Policy

**Last Updated:** ${new Date().toISOString().split('T')[0]}

## DATA WE COLLECT

### Personal Information
- Email address and name (for account creation)
- Fantasy sports preferences and settings
- Usage analytics (anonymized)

### Fantasy Sports Data
- League information and rosters
- Player performance preferences
- AI insight usage patterns

### Technical Data
- IP address (for security and compliance)
- Device information
- Session data

## HOW WE USE DATA

- Provide fantasy sports services
- Improve AI recommendations
- Send service updates (with consent)
- Ensure legal compliance
- Security and fraud prevention

## DATA SHARING

We DO NOT share data with:
- Gambling services (we don't operate any)
- Third-party advertisers
- Data brokers

We MAY share data:
- With service providers (under strict contracts)
- When legally required
- For security purposes

## YOUR RIGHTS

- Access your data
- Correct inaccuracies
- Delete your account
- Export your data
- Opt out of communications

## SECURITY

- All data encrypted in transit and at rest
- Regular security audits
- SOC 2 compliance
- No gambling data collected (we don't offer gambling)

## COMPLIANCE

This policy complies with:
- GDPR (EU)
- CCPA (California)
- PIPEDA (Canada)
- Other applicable privacy laws

## CONTACT

Privacy questions: privacy@fantasy-ai.com
Data requests: data@fantasy-ai.com
    `,
    version: '1.0',
    effectiveDate: new Date(),
    lastUpdated: new Date(),
    isActive: true,
    requiredForSignup: true,
    jurisdictions: ['US', 'CA', 'UK', 'EU']
  },
  {
    id: 'gambling_disclaimer_v1',
    type: 'gambling_disclaimer',
    title: 'Gambling Prohibition Notice',
    content: `
# IMPORTANT: NO GAMBLING SERVICES

## GAMBLING FEATURES DISABLED

Fantasy.AI currently operates in SAFE MODE with all gambling features disabled:

❌ **Disabled Features:**
- Monetary wagering between users
- Live betting functionality  
- Cryptocurrency payments
- Real money tournaments
- Prop betting
- Any form of gambling

✅ **Available Features:**
- Fantasy sports league management
- AI-powered analytics
- Social features
- Premium subscriptions
- Educational content

## WHY GAMBLING IS DISABLED

We are committed to legal compliance and are:
1. Obtaining proper gambling licenses
2. Implementing responsible gambling tools
3. Ensuring jurisdictional compliance
4. Building robust age verification

## FUTURE GAMBLING FEATURES

Once properly licensed, we may offer:
- Regulated peer-to-peer wagering
- Licensed sportsbook integration
- Responsible gambling tools
- Age and jurisdiction verification

## REPORTING VIOLATIONS

If you encounter any gambling-like features, report immediately:
📧 compliance@fantasy-ai.com
🚨 This helps us maintain legal compliance

---
*Last updated: ${new Date().toISOString().split('T')[0]}*
    `,
    version: '1.0',
    effectiveDate: new Date(),
    lastUpdated: new Date(),
    isActive: true,
    requiredForSignup: false,
    jurisdictions: ['ALL']
  }
];

// =============================================================================
// ⚖️ COMPLIANCE CHECKING SYSTEM
// =============================================================================

export class LegalComplianceManager {
  
  /**
   * Check if user's jurisdiction allows access to specific features
   */
  static checkJurisdictionCompliance(
    userLocation: { country: string; state?: string },
    requestedFeatures: string[]
  ): ComplianceCheck {
    
    const jurisdiction = JURISDICTION_RULES.find(rule => 
      rule.country === userLocation.country && 
      (rule.state === userLocation.state || !rule.state)
    );

    if (!jurisdiction) {
      return {
        id: `jurisdiction_${Date.now()}`,
        type: 'jurisdiction_check',
        status: 'failed',
        timestamp: new Date(),
        details: {
          reason: 'Jurisdiction not supported',
          location: userLocation,
          supportedLocations: JURISDICTION_RULES.map(r => ({ country: r.country, state: r.state }))
        }
      };
    }

    const prohibitedFeatures = requestedFeatures.filter(feature => 
      jurisdiction.prohibitedFeatures.includes(feature)
    );

    return {
      id: `jurisdiction_${Date.now()}`,
      type: 'jurisdiction_check',
      status: prohibitedFeatures.length > 0 ? 'failed' : 'passed',
      timestamp: new Date(),
      details: {
        jurisdiction,
        requestedFeatures,
        prohibitedFeatures,
        allowedFeatures: requestedFeatures.filter(f => !prohibitedFeatures.includes(f))
      }
    };
  }

  /**
   * Verify user meets age requirements
   */
  static checkAgeCompliance(
    userAge: number,
    jurisdiction: JurisdictionRules
  ): ComplianceCheck {
    
    const meetsAge = userAge >= jurisdiction.minimumAge;
    
    return {
      id: `age_${Date.now()}`,
      type: 'age_verification',
      status: meetsAge ? 'passed' : 'failed',
      timestamp: new Date(),
      details: {
        userAge,
        minimumAge: jurisdiction.minimumAge,
        jurisdiction: jurisdiction.country + (jurisdiction.state ? `, ${jurisdiction.state}` : '')
      }
    };
  }

  /**
   * Check if specific features are allowed in current compliance mode
   */
  static checkFeatureAccess(
    requestedFeature: string,
    userContext?: { age?: number; location?: { country: string; state?: string } }
  ): ComplianceCheck {
    
    // First check if gambling features are globally disabled
    if (COMPLIANCE.isSafeMode() && this.isGamblingFeature(requestedFeature)) {
      return {
        id: `feature_${Date.now()}`,
        type: 'feature_access',
        status: 'failed',
        timestamp: new Date(),
        details: {
          reason: 'Gambling features disabled in safe mode',
          feature: requestedFeature,
          safeMode: true,
          enabledGamblingFeatures: COMPLIANCE.getEnabledGamblingFeatures()
        }
      };
    }

    // Check jurisdiction-specific restrictions
    if (userContext?.location) {
      const jurisdictionCheck = this.checkJurisdictionCompliance(
        userContext.location,
        [requestedFeature]
      );
      
      if (jurisdictionCheck.status === 'failed') {
        return {
          id: `feature_${Date.now()}`,
          type: 'feature_access',
          status: 'failed',
          timestamp: new Date(),
          details: {
            reason: 'Feature prohibited in user jurisdiction',
            feature: requestedFeature,
            jurisdictionCheck
          }
        };
      }
    }

    return {
      id: `feature_${Date.now()}`,
      type: 'feature_access',
      status: 'passed',
      timestamp: new Date(),
      details: {
        feature: requestedFeature,
        accessGranted: true
      }
    };
  }

  /**
   * Generate compliance audit report
   */
  static generateComplianceAudit(): {
    timestamp: string;
    safeMode: boolean;
    enabledGamblingFeatures: string[];
    supportedJurisdictions: string[];
    activeLegalDocuments: LegalDocument[];
    complianceScore: number;
    recommendations: string[];
  } {
    
    const audit = COMPLIANCE.generateAuditLog();
    const activeDocs = LEGAL_DOCUMENTS.filter(doc => doc.isActive);
    
    // Calculate compliance score (0-100)
    let score = 100;
    if (!COMPLIANCE.isSafeMode()) score -= 50; // Major penalty for gambling features
    if (activeDocs.length < 3) score -= 20; // Need basic legal docs
    if (!activeDocs.some(doc => doc.type === 'privacy_policy')) score -= 15;
    if (!activeDocs.some(doc => doc.type === 'terms_of_service')) score -= 15;
    
    const recommendations: string[] = [];
    if (!COMPLIANCE.isSafeMode()) {
      recommendations.push('🚨 CRITICAL: Disable all gambling features immediately');
    }
    if (score < 90) {
      recommendations.push('📋 Update legal documents to ensure full compliance');
    }
    if (audit.enabledGamblingFeatures.length > 0) {
      recommendations.push('⚖️ Obtain proper gambling licenses before enabling gambling features');
    }

    return {
      timestamp: audit.timestamp,
      safeMode: audit.safeMode,
      enabledGamblingFeatures: audit.enabledGamblingFeatures,
      supportedJurisdictions: JURISDICTION_RULES.map(r => 
        r.country + (r.state ? `, ${r.state}` : '')
      ),
      activeLegalDocuments: activeDocs,
      complianceScore: Math.max(0, score),
      recommendations
    };
  }

  /**
   * Check if a feature is considered gambling-related
   */
  private static isGamblingFeature(feature: string): boolean {
    const gamblingKeywords = [
      'WAGERING', 'BETTING', 'CRYPTO', 'NFT', 'MONEY', 'PAYMENT',
      'LIVE_BETTING', 'PROP_BETTING', 'BOUNTY', 'ESCROW'
    ];
    
    return gamblingKeywords.some(keyword => feature.includes(keyword));
  }

  /**
   * Get required legal documents for a jurisdiction
   */
  static getRequiredDocuments(jurisdiction: string): LegalDocument[] {
    return LEGAL_DOCUMENTS.filter(doc => 
      doc.isActive && 
      (doc.jurisdictions.includes(jurisdiction) || doc.jurisdictions.includes('ALL'))
    );
  }

  /**
   * Emergency compliance shutdown
   */
  static emergencyShutdown(reason: string): {
    success: boolean;
    shutdownTime: Date;
    affectedFeatures: string[];
    auditLog: any;
  } {
    console.error('🚨 EMERGENCY COMPLIANCE SHUTDOWN:', reason);
    
    // In a real implementation, this would:
    // 1. Disable all gambling features in database
    // 2. Log the shutdown for audit purposes
    // 3. Notify compliance team
    // 4. Display maintenance page for gambling features
    
    const affectedFeatures = COMPLIANCE.getEnabledGamblingFeatures();
    const auditLog = this.generateComplianceAudit();
    
    return {
      success: true,
      shutdownTime: new Date(),
      affectedFeatures,
      auditLog
    };
  }
}

// =============================================================================
// 🛡️ COMPLIANCE MIDDLEWARE (FOR API ROUTES)
// =============================================================================

export function createComplianceMiddleware() {
  return (req: any, res: any, next: any) => {
    // Add compliance headers
    res.setHeader('X-Compliance-Mode', COMPLIANCE.isSafeMode() ? 'SAFE' : 'GAMBLING');
    res.setHeader('X-Gambling-Features', COMPLIANCE.getEnabledGamblingFeatures().join(','));
    
    // Log feature access attempts
    if (req.path.includes('wagering') || req.path.includes('betting')) {
      console.log('🔍 Gambling feature access attempt:', {
        path: req.path,
        safeMode: COMPLIANCE.isSafeMode(),
        userAgent: req.headers['user-agent'],
        ip: req.ip
      });
    }
    
    next();
  };
}

export default LegalComplianceManager;