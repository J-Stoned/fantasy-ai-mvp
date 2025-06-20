"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Plus,
  Zap,
  Brain,
  BarChart3,
  MessageCircle,
  DollarSign,
  Trophy,
  Users,
  Settings,
  Search,
  Crown,
  X
} from "lucide-react";

const quickActions = [
  {
    name: "AI Analytics",
    href: "/dashboard/analytics",
    icon: Zap,
    color: "neon-purple",
    description: "Get instant AI insights"
  },
  {
    name: "Live Betting",
    href: "/betting",
    icon: DollarSign,
    color: "neon-green",
    description: "Place smart bets"
  },
  {
    name: "Draft Helper",
    href: "/draft",
    icon: Users,
    color: "neon-blue",
    description: "Optimize your draft"
  },
  {
    name: "Social Hub",
    href: "/social",
    icon: MessageCircle,
    color: "neon-pink",
    description: "Connect with league"
  },
  {
    name: "DFS Optimizer",
    href: "/dfs",
    icon: Trophy,
    color: "neon-orange",
    description: "Build winning lineups"
  },
  {
    name: "Admin Panel",
    href: "/admin",
    icon: Crown,
    color: "neon-gold",
    description: "System control"
  }
];

export function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleActions = () => setIsOpen(!isOpen);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Quick Action Items */}
      <AnimatePresence>
        {isOpen && (
          <div className="absolute bottom-16 right-0 space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.href}
                  initial={{ opacity: 0, scale: 0, x: 20 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    x: 0,
                    transition: { delay: index * 0.1 }
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0, 
                    x: 20,
                    transition: { delay: (quickActions.length - index) * 0.05 }
                  }}
                  className="flex items-center gap-3"
                >
                  <div className="bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 text-sm text-gray-300 whitespace-nowrap">
                    {action.description}
                  </div>
                  <Link href={action.href} onClick={() => setIsOpen(false)}>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`w-12 h-12 bg-${action.color}/20 border border-${action.color}/30 rounded-full flex items-center justify-center backdrop-blur-md hover:bg-${action.color}/30 transition-colors group`}
                    >
                      <Icon className={`w-6 h-6 text-${action.color} group-hover:scale-110 transition-transform`} />
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Main Quick Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleActions}
        className={`w-16 h-16 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 ${
          isOpen ? 'shadow-neon-blue/50' : ''
        }`}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? (
            <X className="w-8 h-8 text-white" />
          ) : (
            <Plus className="w-8 h-8 text-white" />
          )}
        </motion.div>
      </motion.button>

      {/* Pulse Effect */}
      {!isOpen && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple animate-ping opacity-30" />
      )}
    </div>
  );
}