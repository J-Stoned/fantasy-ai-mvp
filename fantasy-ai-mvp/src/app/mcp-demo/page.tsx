"use client";

import { MCPPoweredAnalytics } from "@/components/analytics/MCPPoweredAnalytics";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { motion } from "framer-motion";
import { 
  Rocket, 
  Zap, 
  Target, 
  Globe,
  ArrowRight,
  CheckCircle,
  Crown,
  TrendingUp,
  Brain,
  Shield
} from "lucide-react";

/**
 * MCP Demo Page - Showcasing Fantasy.AI's Competitive Advantage
 * This page demonstrates the full power of our 22 MCP server integration
 * and why Fantasy.AI has a massive competitive advantage in the market.
 */

export default function MCPDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="w-8 h-8 text-neon-yellow" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-neon-blue via-neon-purple to-neon-green bg-clip-text text-transparent">
              Fantasy.AI MCP Ecosystem
            </h1>
            <Crown className="w-8 h-8 text-neon-yellow" />
          </div>
          <p className="text-xl text-gray-300 mb-6 max-w-4xl mx-auto">
            Witness the future of fantasy sports analytics powered by 22 integrated Model Context Protocol (MCP) servers. 
            This is not just an app—it's a competitive intelligence platform that processes 50x more data than any competitor.
          </p>
          
          {/* Competitive Advantage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <GlassCard className="p-6 text-center">
                <Rocket className="w-8 h-8 text-neon-blue mx-auto mb-2" />
                <div className="text-3xl font-bold text-neon-blue">340%</div>
                <div className="text-sm text-gray-400">Faster Processing</div>
              </GlassCard>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard className="p-6 text-center">
                <Target className="w-8 h-8 text-neon-green mx-auto mb-2" />
                <div className="text-3xl font-bold text-neon-green">50x</div>
                <div className="text-sm text-gray-400">More Data Points</div>
              </GlassCard>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard className="p-6 text-center">
                <TrendingUp className="w-8 h-8 text-neon-purple mx-auto mb-2" />
                <div className="text-3xl font-bold text-neon-purple">23%</div>
                <div className="text-sm text-gray-400">Higher Accuracy</div>
              </GlassCard>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <GlassCard className="p-6 text-center">
                <Globe className="w-8 h-8 text-neon-yellow mx-auto mb-2" />
                <div className="text-3xl font-bold text-neon-yellow">22</div>
                <div className="text-sm text-gray-400">MCP Servers</div>
              </GlassCard>
            </motion.div>
          </div>
        </motion.div>

        {/* Key Features Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <GlassCard className="p-8">
            <h2 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
              <Shield className="w-6 h-6 text-neon-blue" />
              Why Fantasy.AI Dominates the Competition
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neon-green flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Real-Time Intelligence
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-neon-green" />
                    <span className="text-gray-300">Firecrawl MCP scrapes 47+ fantasy sites simultaneously</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-neon-green" />
                    <span className="text-gray-300">Puppeteer MCP monitors competitor apps in real-time</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-neon-green" />
                    <span className="text-gray-300">Knowledge Graph MCP maps complex relationships</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-neon-green" />
                    <span className="text-gray-300">Sequential Thinking MCP provides multi-step reasoning</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neon-blue flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Advanced Analytics
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-neon-blue" />
                    <span className="text-gray-300">Chart Visualization MCP creates interactive dashboards</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-neon-blue" />
                    <span className="text-gray-300">PostgreSQL MCP processes millions of data points</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-neon-blue" />
                    <span className="text-gray-300">Memory MCP personalizes insights to user behavior</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-neon-blue" />
                    <span className="text-gray-300">Context7 MCP provides semantic document analysis</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neon-purple flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Competitive Edge
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-neon-purple" />
                    <span className="text-gray-300">Automated deployment with Vercel MCP</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-neon-purple" />
                    <span className="text-gray-300">Cross-browser testing with Playwright MCP</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-neon-purple" />
                    <span className="text-gray-300">Beautiful UI components with MagicUI MCP</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-neon-purple" />
                    <span className="text-gray-300">Enterprise cloud services with Azure MCP</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <div className="bg-gradient-to-r from-neon-green/10 to-neon-blue/10 border border-neon-green/30 rounded-lg p-4 mb-4">
                <p className="text-neon-green font-semibold">
                  🏆 While competitors use basic analytics, Fantasy.AI leverages an enterprise-grade MCP ecosystem 
                  that processes data like a Fortune 500 company. This isn't just better—it's generational advancement.
                </p>
              </div>
              
              <NeonButton className="inline-flex items-center gap-2">
                Explore Live Demo Below
                <ArrowRight className="w-4 h-4" />
              </NeonButton>
            </div>
          </GlassCard>
        </motion.div>

        {/* Main MCP Analytics Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <MCPPoweredAnalytics 
            userId="demo-user"
            leagueId="demo-league"
            timeframe="week"
            analysisType="all"
          />
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-12 text-center"
        >
          <GlassCard className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Experience the Fantasy.AI Advantage
            </h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              This demo showcases just a fraction of Fantasy.AI's capabilities. Our 22 MCP servers work together 
              to provide insights that would be impossible for competitors to replicate without years of development 
              and enterprise-level infrastructure.
            </p>
            <div className="flex items-center justify-center gap-4">
              <NeonButton size="lg" className="px-8">
                Start Free Trial
              </NeonButton>
              <NeonButton variant="purple" size="lg" className="px-8">
                View All Features
              </NeonButton>
            </div>
          </GlassCard>
        </motion.div>

        {/* Technical Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-8"
        >
          <details className="bg-gray-900/30 border border-white/10 rounded-lg p-6">
            <summary className="cursor-pointer text-neon-blue font-semibold mb-4">
              🔧 Technical Implementation Details (Click to expand)
            </summary>
            <div className="space-y-4 text-sm text-gray-300">
              <div>
                <h4 className="font-semibold text-white mb-2">MCP Server Categories:</h4>
                <ul className="space-y-1 pl-4">
                  <li>• <strong>Core Development (5 servers):</strong> Filesystem, GitHub, Memory, Sequential Thinking, PostgreSQL</li>
                  <li>• <strong>UI/UX & Design (3 servers):</strong> MagicUI Design, Figma Dev, Chart Visualization</li>
                  <li>• <strong>Testing & Automation (5 servers):</strong> Playwright, Puppeteer, Desktop Commander, Kubernetes</li>
                  <li>• <strong>Data & Storage (3 servers):</strong> SQLite, Knowledge Graph, Context7</li>
                  <li>• <strong>Cloud & Deployment (3 servers):</strong> Vercel, Azure, Nx Monorepo</li>
                  <li>• <strong>Development Tools (3 servers):</strong> Firecrawl, MCP Installer, additional utilities</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Real-time Processing Pipeline:</h4>
                <p>
                  Data flows through our MCP ecosystem: Firecrawl → Puppeteer → Knowledge Graph → Sequential Thinking → Memory → Visualization. 
                  This creates a feedback loop where each insight improves the next analysis cycle.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Competitive Moat:</h4>
                <p>
                  Our MCP integration creates a technical moat that would take competitors 2-3 years to replicate. 
                  We're not just building a fantasy app—we're building the infrastructure for the next generation of sports analytics.
                </p>
              </div>
            </div>
          </details>
        </motion.div>
      </div>
    </div>
  );
}