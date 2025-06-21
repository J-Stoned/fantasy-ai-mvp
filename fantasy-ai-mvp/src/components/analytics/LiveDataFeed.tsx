"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { 
  Rss,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Clock,
  Globe,
  Brain,
  Database,
  Cpu,
  Cloud,
  Target,
  Sparkles,
  BarChart3,
  Eye
} from "lucide-react";

interface LiveDataEvent {
  id: string;
  timestamp: Date;
  type: "injury" | "news" | "weather" | "lineup" | "trade" | "performance" | "mcp_insight" | "knowledge_graph" | "ai_decision";
  player: string;
  team: string;
  impact: "high" | "medium" | "low";
  description: string;
  source: string;
  confidence: number;
  mcpEnhanced?: {
    insightType: string;
    aiReasoning: string[];
    actionSuggestions: string[];
    knowledgeGraphConnections: number;
    sequentialThinkingSteps: number;
  };
}

interface DataSource {
  name: string;
  status: "connected" | "disconnected" | "error";
  lastUpdate: Date;
  dataPoints: number;
  mcpServer: string;
  mcpCapabilities?: {
    hasKnowledgeGraph: boolean;
    hasSequentialThinking: boolean;
    hasDataCollection: boolean;
    confidenceScore: number;
  };
}

export function LiveDataFeed() {
  const [events, setEvents] = useState<LiveDataEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [dataSources, setDataSources] = useState<DataSource[]>([
    {
      name: "MCP Enhanced Data Collection",
      status: "connected",
      lastUpdate: new Date(),
      dataPoints: 1247,
      mcpServer: "firecrawl-mcp + puppeteer-mcp",
      mcpCapabilities: {
        hasKnowledgeGraph: true,
        hasSequentialThinking: true,
        hasDataCollection: true,
        confidenceScore: 0.94
      }
    },
    {
      name: "Knowledge Graph Insights",
      status: "connected", 
      lastUpdate: new Date(Date.now() - 15000),
      dataPoints: 342,
      mcpServer: "knowledge-graph-mcp",
      mcpCapabilities: {
        hasKnowledgeGraph: true,
        hasSequentialThinking: false,
        hasDataCollection: false,
        confidenceScore: 0.91
      }
    },
    {
      name: "Sequential Thinking AI",
      status: "connected",
      lastUpdate: new Date(Date.now() - 8000),
      dataPoints: 156,
      mcpServer: "sequential-thinking-mcp",
      mcpCapabilities: {
        hasKnowledgeGraph: false,
        hasSequentialThinking: true,
        hasDataCollection: false,
        confidenceScore: 0.88
      }
    },
    {
      name: "Real-time Sports Pipeline",
      status: "connected",
      lastUpdate: new Date(Date.now() - 5000),
      dataPoints: 789,
      mcpServer: "integrated-pipeline",
      mcpCapabilities: {
        hasKnowledgeGraph: true,
        hasSequentialThinking: true,
        hasDataCollection: true,
        confidenceScore: 0.96
      }
    }
  ]);

  // Simulate real-time data stream
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const eventTypes = ["injury", "news", "weather", "lineup", "trade", "performance", "mcp_insight", "knowledge_graph", "ai_decision"];
      const players = ["Josh Allen", "Christian McCaffrey", "Tyreek Hill", "Travis Kelce", "Cooper Kupp"];
      const teams = ["BUF", "SF", "MIA", "KC", "LAR"];
      const selectedType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      const newEvent: LiveDataEvent = {
        id: `event_${Date.now()}`,
        timestamp: new Date(),
        type: selectedType as any,
        player: players[Math.floor(Math.random() * players.length)],
        team: teams[Math.floor(Math.random() * teams.length)],
        impact: ["high", "medium", "low"][Math.floor(Math.random() * 3)] as any,
        description: generateMCPEnhancedDescription(selectedType),
        source: getMCPSource(selectedType),
        confidence: 0.75 + Math.random() * 0.25,
        ...(["mcp_insight", "knowledge_graph", "ai_decision"].includes(selectedType) && {
          mcpEnhanced: {
            insightType: selectedType === "mcp_insight" ? "Player Advantage Detection" : 
                        selectedType === "knowledge_graph" ? "Relationship Pattern Match" : "Strategic Decision Analysis",
            aiReasoning: generateAIReasoning(selectedType),
            actionSuggestions: generateActionSuggestions(selectedType),
            knowledgeGraphConnections: Math.floor(Math.random() * 15) + 5,
            sequentialThinkingSteps: Math.floor(Math.random() * 6) + 3
          }
        })
      };

      setEvents(prev => [newEvent, ...prev.slice(0, 24)]); // Keep last 25 events

      // Simulate data source updates
      setDataSources(prev => prev.map(source => ({
        ...source,
        lastUpdate: Math.random() > 0.7 ? new Date() : source.lastUpdate,
        dataPoints: source.dataPoints + Math.floor(Math.random() * 5)
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, [isStreaming]);

  function generateMCPEnhancedDescription(type: string): string {
    const descriptions = {
      injury: [
        "Limited in practice due to ankle injury",
        "Upgraded to full participant in team practice",
        "Added to injury report with questionable status"
      ],
      news: [
        "Target share increased 8% over last three games",
        "Defensive coordinator announces new coverage scheme",
        "Trading interest reported from multiple teams"
      ],
      weather: [
        "Weather forecast shows 15+ mph winds for Sunday game",
        "Clear skies and optimal playing conditions expected",
        "Temperature dropping to 28°F with snow expected"
      ],
      mcp_insight: [
        "🧠 MCP Analysis: Favorable matchup pattern detected with 89% confidence",
        "🎯 AI Insight: Player performance correlation suggests 25% upside opportunity",
        "⚡ Smart Detection: Usage spike pattern matches historical breakout games"
      ],
      knowledge_graph: [
        "🔗 Graph Analysis: Strong relationship pattern between QB and WR performance",
        "📊 Network Insight: Team offensive efficiency correlates with weather conditions",
        "🧩 Pattern Match: Similar game script scenarios show 78% success rate"
      ],
      ai_decision: [
        "🤖 AI Decision: Sequential analysis recommends lineup adjustment",
        "📈 Strategic Insight: Multi-step reasoning suggests stack opportunity",
        "🎲 Decision Engine: Risk-adjusted recommendation with 92% confidence"
      ]
    };

    const categoryDescriptions = descriptions[type as keyof typeof descriptions] || descriptions.news;
    return categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];
  }

  function getMCPSource(type: string): string {
    const sources = {
      mcp_insight: "MCP Enhanced AI",
      knowledge_graph: "Knowledge Graph MCP",
      ai_decision: "Sequential Thinking MCP",
      injury: "ESPN via Firecrawl MCP",
      news: "FantasyPros via Puppeteer MCP",
      weather: "Weather.com via MCP Pipeline"
    };
    return sources[type as keyof typeof sources] || "MCP Data Collection";
  }

  function generateAIReasoning(type: string): string[] {
    const reasoning = {
      mcp_insight: [
        "Historical matchup data shows 73% success rate",
        "Player usage patterns align with optimal conditions",
        "Defensive vulnerability detected through graph analysis"
      ],
      knowledge_graph: [
        "15 related entities show positive correlation",
        "Team performance patterns match current scenario",
        "Weather impact factors favor offensive output"
      ],
      ai_decision: [
        "Step 1: Analyzed positional value differences",
        "Step 2: Evaluated matchup advantages",
        "Step 3: Assessed risk-reward optimization"
      ]
    };
    return reasoning[type as keyof typeof reasoning] || ["Standard analysis applied"];
  }

  function generateActionSuggestions(type: string): string[] {
    const actions = {
      mcp_insight: ["Consider increasing player priority", "Monitor target share trends", "Check for stack opportunities"],
      knowledge_graph: ["Explore related player connections", "Analyze team correlation patterns", "Review historical outcomes"],
      ai_decision: ["Implement lineup adjustment", "Set up contingency plans", "Monitor confidence levels"]
    };
    return actions[type as keyof typeof actions] || ["Review and monitor"];
  }

  const getEventIcon = (type: string, impact: string) => {
    const baseIcons = {
      injury: AlertTriangle,
      news: Rss,
      weather: Cloud,
      lineup: Activity,
      trade: TrendingUp,
      performance: Zap,
      mcp_insight: Brain,
      knowledge_graph: BarChart3,
      ai_decision: Target
    };
    
    const Icon = baseIcons[type as keyof typeof baseIcons] || Activity;
    
    // Special styling for MCP-enhanced events
    const isMCPEnhanced = ["mcp_insight", "knowledge_graph", "ai_decision"].includes(type);
    if (isMCPEnhanced) {
      return <Icon className={`w-4 h-4 text-purple-400 animate-pulse`} />;
    }
    
    const color = impact === "high" ? "neon-red" : 
                  impact === "medium" ? "neon-yellow" : "neon-green";
    
    return <Icon className={`w-4 h-4 text-${color}`} />;
  };

  const getSourceStatusColor = (status: string): string => {
    switch (status) {
      case "connected": return "neon-green";
      case "disconnected": return "neon-yellow";
      case "error": return "neon-red";
      default: return "gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-neon-blue" />
            Live Data Pipeline
          </h3>
          <p className="text-sm text-gray-400">Real-time sports data via MCP servers</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <motion.div
              className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-neon-green' : 'bg-gray-500'}`}
              animate={isStreaming ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-sm text-gray-400">
              {isStreaming ? "Live" : "Paused"}
            </span>
          </div>
          <NeonButton
            size="sm"
            variant={isStreaming ? "purple" : "green"}
            onClick={() => setIsStreaming(!isStreaming)}
          >
            {isStreaming ? "Pause" : "Resume"}
          </NeonButton>
        </div>
      </div>

      {/* Data Sources Status */}
      <GlassCard className="p-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-neon-purple" />
          MCP Server Status
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {dataSources.map((source, index) => (
            <motion.div
              key={source.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <motion.div
                  className={`w-2 h-2 rounded-full bg-${getSourceStatusColor(source.status)}`}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-sm font-medium text-white">{source.name}</span>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <p>Server: {source.mcpServer}</p>
                <p>Data points: {source.dataPoints}</p>
                <p>Updated: {Math.floor((Date.now() - source.lastUpdate.getTime()) / 1000)}s ago</p>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Live Events Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Events */}
        <div className="lg:col-span-2">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Brain className="w-4 h-4 text-neon-yellow" />
                Live Events & AI Analysis
              </h4>
              <span className="text-xs text-gray-400">
                {events.length} events
              </span>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {events.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      event.mcpEnhanced 
                        ? "bg-purple-500/20 border-purple-400/50 shadow-purple-400/20 shadow-lg" 
                        : event.impact === "high" ? "bg-neon-red/10 border-neon-red/30" :
                          event.impact === "medium" ? "bg-neon-yellow/10 border-neon-yellow/30" :
                          "bg-neon-green/10 border-neon-green/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getEventIcon(event.type, event.impact)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">{event.player}</span>
                          <span className="text-xs text-gray-400">{event.team}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full capitalize ${
                            event.impact === "high" ? "bg-neon-red/20 text-neon-red" :
                            event.impact === "medium" ? "bg-neon-yellow/20 text-neon-yellow" :
                            "bg-neon-green/20 text-neon-green"
                          }`}>
                            {event.impact}
                          </span>
                          {event.mcpEnhanced && (
                            <span className="text-xs px-1.5 py-0.5 bg-purple-500/30 text-purple-300 rounded-full flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              MCP Enhanced
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-300">{event.description}</p>
                        
                        {/* MCP Enhanced Details */}
                        {event.mcpEnhanced && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-3 p-2 bg-purple-500/10 rounded border border-purple-400/30"
                          >
                            <div className="text-xs space-y-2">
                              <div className="flex items-center gap-2">
                                <Brain className="w-3 h-3 text-purple-400" />
                                <span className="font-medium text-purple-300">
                                  {event.mcpEnhanced.insightType}
                                </span>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="text-purple-200 font-medium">AI Reasoning:</div>
                                {event.mcpEnhanced.aiReasoning.map((reason, idx) => (
                                  <div key={idx} className="text-gray-300 text-xs">• {reason}</div>
                                ))}
                              </div>
                              
                              <div className="space-y-1">
                                <div className="text-purple-200 font-medium">Action Suggestions:</div>
                                {event.mcpEnhanced.actionSuggestions.map((action, idx) => (
                                  <div key={idx} className="text-gray-300 text-xs">→ {action}</div>
                                ))}
                              </div>
                              
                              <div className="flex items-center gap-4 pt-1">
                                <span className="text-gray-400">
                                  Graph Connections: {event.mcpEnhanced.knowledgeGraphConnections}
                                </span>
                                <span className="text-gray-400">
                                  Thinking Steps: {event.mcpEnhanced.sequentialThinkingSteps}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                        
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span>{event.source}</span>
                          <span>•</span>
                          <span>{event.timestamp.toLocaleTimeString()}</span>
                          <span>•</span>
                          <span>AI Confidence: {(event.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </GlassCard>
        </div>

        {/* Pipeline Analytics */}
        <div className="space-y-4">
          {/* Processing Stats */}
          <GlassCard className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-neon-blue" />
              Pipeline Metrics
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Events/min</span>
                <span className="text-lg font-bold text-neon-blue">
                  {Math.floor(Math.random() * 15) + 5}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Processing delay</span>
                <span className="text-lg font-bold text-neon-green">
                  {Math.floor(Math.random() * 100) + 50}ms
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">High impact events</span>
                <span className="text-lg font-bold text-neon-red">
                  {events.filter(e => e.impact === "high").length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">AI accuracy</span>
                <span className="text-lg font-bold text-neon-purple">
                  {(events.reduce((acc, e) => acc + e.confidence, 0) / Math.max(events.length, 1) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </GlassCard>

          {/* MCP Integration Status */}
          <GlassCard className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-neon-purple" />
              MCP Integration
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Active MCP Servers</span>
                <span className="text-lg font-bold text-neon-purple">
                  {dataSources.filter(s => s.status === "connected").length}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Enhanced Events</span>
                <span className="text-lg font-bold text-purple-400">
                  {events.filter(e => e.mcpEnhanced).length}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Knowledge Graph</span>
                <span className="text-sm text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Active
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Sequential Thinking</span>
                <span className="text-sm text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Active
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Data Collection</span>
                <span className="text-sm text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Enhanced
                </span>
              </div>
              
              <div className="mt-3 p-2 bg-purple-500/10 rounded border border-purple-400/30">
                <div className="text-xs text-center text-purple-300">
                  🚀 All MCP servers operational
                </div>
                <div className="text-xs text-center text-gray-400 mt-1">
                  Enhanced intelligence active
                </div>
              </div>
            </div>
          </GlassCard>
          
          {/* MCP Capabilities */}
          <GlassCard className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-neon-yellow" />
              Enhanced Capabilities
            </h4>
            <div className="space-y-2">
              {dataSources
                .filter(source => source.mcpCapabilities)
                .map((source, index) => (
                  <motion.div
                    key={source.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-2 bg-white/5 rounded border border-white/10"
                  >
                    <div className="text-xs font-medium text-white mb-1">
                      {source.name}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {source.mcpCapabilities?.hasKnowledgeGraph && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                          Graph
                        </span>
                      )}
                      {source.mcpCapabilities?.hasSequentialThinking && (
                        <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                          AI Thinking
                        </span>
                      )}
                      {source.mcpCapabilities?.hasDataCollection && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-300 rounded">
                          Data Collect
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Confidence: {((source.mcpCapabilities?.confidenceScore || 0) * 100).toFixed(0)}%
                    </div>
                  </motion.div>
                ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}