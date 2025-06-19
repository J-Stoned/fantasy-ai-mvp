"use client";

/**
 * 💰 PRICING PAGE
 * 
 * Showcases subscription tiers and legal revenue model for Fantasy.AI
 * This provides immediate monetization while gambling features are disabled.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { SafeModeIndicator } from "@/components/compliance/ComplianceWrapper";
import { SUBSCRIPTION_PLANS, SubscriptionManager, type BillingInterval } from "@/lib/subscription-system";
import { COMPLIANCE } from "@/lib/feature-flags";
import { 
  Crown, 
  Check, 
  X, 
  Zap, 
  Star, 
  Shield,
  TrendingUp,
  Users,
  Brain,
  Mic,
  BarChart3,
  Settings,
  Sparkles,
  ArrowRight
} from "lucide-react";

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  const isSafeMode = COMPLIANCE.isSafeMode();
  const revenueAnalytics = SubscriptionManager.generateRevenueAnalytics();
  const planComparison = SubscriptionManager.generatePlanComparison();

  const getYearlySavings = (plan: typeof SUBSCRIPTION_PLANS[0]) => {
    if (!plan.yearlyPrice) return 0;
    const monthlyTotal = plan.basePrice * 12;
    return monthlyTotal - plan.yearlyPrice;
  };

  const handleSubscribe = async (planId: string) => {
    setSelectedPlan(planId);
    
    // TODO: Implement actual checkout
    console.log(`💳 Subscribing to plan: ${planId} (${billingInterval})`);
    
    // Mock checkout process
    setTimeout(() => {
      alert(`🎉 Welcome to ${SUBSCRIPTION_PLANS.find(p => p.id === planId)?.name}! This would redirect to Stripe checkout.`);
      setSelectedPlan(null);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background cyber-grid p-6">
      <SafeModeIndicator />
      
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="w-8 h-8 text-neon-yellow" />
            <h1 className="text-4xl font-bold neon-text">Pricing Plans</h1>
          </div>
          <p className="text-xl text-gray-400 mb-6">
            Choose the perfect plan for your fantasy sports journey
          </p>
          
          {/* Safe Mode Banner */}
          {isSafeMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard className="max-w-2xl mx-auto p-4 border-2 border-green-500/30 bg-green-900/10">
                <div className="flex items-center justify-center gap-3">
                  <Shield className="w-5 h-5 text-green-400" />
                  <p className="text-green-400 font-semibold">
                    🛡️ Legal Revenue Model • No Gambling Features • 100% Compliant
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center mb-12"
        >
          <div className="flex items-center gap-4 bg-gray-900/50 p-2 rounded-lg border border-white/10">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                billingInterval === 'monthly'
                  ? 'bg-neon-blue/20 text-neon-blue glow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${
                billingInterval === 'yearly'
                  ? 'bg-neon-purple/20 text-neon-purple glow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="text-xs bg-neon-green/20 text-neon-green px-2 py-1 rounded-full">
                Save up to 17%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {SUBSCRIPTION_PLANS.map((plan, index) => {
            const pricing = SubscriptionManager.calculatePricing(plan.id, billingInterval);
            const isPopular = plan.popular;
            const savings = getYearlySavings(plan);
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="relative"
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-neon-purple to-neon-pink px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <GlassCard className={`h-full hover:glow-md transition-all duration-300 ${
                  isPopular ? 'border-2 border-neon-purple/50 glow-sm' : ''
                }`}>
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center mb-3">
                      {plan.tier === 'FREE' && <Users className="w-8 h-8 text-neon-green" />}
                      {plan.tier === 'PRO' && <Zap className="w-8 h-8 text-neon-blue" />}
                      {plan.tier === 'ELITE' && <Crown className="w-8 h-8 text-neon-yellow" />}
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                    
                    <div className="mb-4">
                      {plan.basePrice === 0 ? (
                        <div className="text-4xl font-bold text-neon-green">Free</div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-4xl font-bold">
                            ${billingInterval === 'yearly' && plan.yearlyPrice 
                              ? Math.round(plan.yearlyPrice / 12) 
                              : plan.basePrice}
                            <span className="text-lg text-gray-400">/mo</span>
                          </div>
                          {billingInterval === 'yearly' && plan.yearlyPrice && (
                            <div className="text-sm text-neon-green">
                              Save ${savings}/year
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        {feature.startsWith('✅') ? (
                          <Check className="w-5 h-5 text-neon-green flex-shrink-0" />
                        ) : feature.startsWith('🚀') ? (
                          <Star className="w-5 h-5 text-neon-blue flex-shrink-0" />
                        ) : feature.startsWith('⭐') ? (
                          <Sparkles className="w-5 h-5 text-neon-yellow flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        )}
                        <span className="text-sm">{feature.slice(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <NeonButton
                    variant={plan.tier === 'FREE' ? 'green' : plan.tier === 'PRO' ? 'blue' : 'purple'}
                    className="w-full"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={selectedPlan === plan.id}
                  >
                    {selectedPlan === plan.id ? (
                      'Processing...'
                    ) : plan.tier === 'FREE' ? (
                      'Get Started Free'
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </NeonButton>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-16"
        >
          <GlassCard className="overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-center">Feature Comparison</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 font-semibold">Features</th>
                    {planComparison.plans.map((plan) => (
                      <th key={plan.tier} className="text-center p-4 font-semibold">
                        <div className="space-y-1">
                          <div>{plan.name}</div>
                          <div className="text-sm text-gray-400">{plan.price}</div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {planComparison.features.map((feature, index) => (
                    <tr key={feature} className={index % 2 === 0 ? 'bg-white/5' : ''}>
                      <td className="p-4 font-medium">{feature}</td>
                      {planComparison.plans.map((plan) => (
                        <td key={plan.tier} className="text-center p-4">
                          <span className={
                            plan.features[feature] === '✅' ? 'text-neon-green' :
                            plan.features[feature] === '❌' ? 'text-gray-500' :
                            'text-white'
                          }>
                            {plan.features[feature]}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </motion.div>

        {/* Revenue Analytics (for internal tracking) */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="mb-16"
          >
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-neon-green" />
                Revenue Analytics (Dev Only)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-blue">{revenueAnalytics.totalSubscribers}</div>
                  <div className="text-sm text-gray-400">Total Subscribers</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-green">${revenueAnalytics.monthlyRecurringRevenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">Monthly Recurring Revenue</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-purple">${revenueAnalytics.averageRevenuePerUser}</div>
                  <div className="text-sm text-gray-400">Average Revenue Per User</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-yellow">{(revenueAnalytics.conversionRate * 100).toFixed(1)}%</div>
                  <div className="text-sm text-gray-400">Conversion Rate</div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <GlassCard className="p-8">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-neon-blue mb-2">Is this a gambling service?</h4>
                <p className="text-gray-400 text-sm">
                  No! Fantasy.AI currently operates in safe mode with zero gambling features. 
                  We provide legal fantasy sports analytics and tools only.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-neon-green mb-2">Can I cancel anytime?</h4>
                <p className="text-gray-400 text-sm">
                  Yes, you can cancel your subscription at any time. You'll continue to have access 
                  until the end of your billing period.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-neon-purple mb-2">What payment methods do you accept?</h4>
                <p className="text-gray-400 text-sm">
                  We accept all major credit cards, PayPal, and ACH bank transfers through 
                  our secure Stripe payment processing.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-neon-yellow mb-2">Do you offer refunds?</h4>
                <p className="text-gray-400 text-sm">
                  We offer a 14-day money-back guarantee on all paid plans. No questions asked.
                </p>
              </div>
            </div>

            <div className="text-center mt-8">
              <p className="text-gray-400 mb-4">Still have questions?</p>
              <NeonButton variant="blue">
                Contact Support
                <ArrowRight className="w-4 h-4 ml-2" />
              </NeonButton>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}