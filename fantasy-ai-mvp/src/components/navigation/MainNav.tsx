"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity,
  Brain,
  Crown,
  Globe,
  Network,
  Zap,
  BarChart3,
  Home,
  Menu,
  X,
  Search,
  Bell,
  User,
  Settings,
  Trophy,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  Gamepad2,
  MessageCircle,
  Coffee,
  Mic
} from "lucide-react";

const mainRoutes = [
  {
    name: "Home",
    href: "/",
    icon: Home,
    description: "Command Center"
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Activity,
    description: "Main Control"
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: Zap,
    description: "AI Insights"
  },
  {
    name: "Voice Demo",
    href: "/voice-demo",
    icon: Mic,
    description: "ElevenLabs AI"
  },
  {
    name: "Betting",
    href: "/betting",
    icon: DollarSign,
    description: "Live Betting"
  },
  {
    name: "DFS",
    href: "/dfs",
    icon: Trophy,
    description: "Daily Fantasy"
  },
  {
    name: "Draft",
    href: "/draft",
    icon: Users,
    description: "Draft Center"
  },
  {
    name: "Social",
    href: "/social",
    icon: MessageCircle,
    description: "Community"
  },
  {
    name: "Sports",
    href: "/sports",
    icon: Gamepad2,
    description: "Multi-Sport"
  }
];

const adminRoutes = [
  {
    name: "AI Systems",
    href: "/dashboard/ai-systems",
    icon: Brain,
    description: "Neural Networks"
  },
  {
    name: "MCP",
    href: "/dashboard/mcp",
    icon: Network,
    description: "22 Servers"
  },
  {
    name: "Multi-Sport",
    href: "/dashboard/multi-sport",
    icon: Globe,
    description: "Global Expansion"
  },
  {
    name: "Admin",
    href: "/admin",
    icon: Crown,
    description: "Supreme Control"
  }
];

export function MainNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Main Navigation Bar */}
      <nav className="bg-gradient-to-r from-slate-950/95 to-gray-900/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-2xl font-bold bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink bg-clip-text text-transparent">
                  Fantasy.AI
                </span>
                <div className="text-xs text-gray-400 -mt-1">Next-Gen Platform</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {mainRoutes.map((route) => {
                const isActive = pathname === route.href || 
                  (route.href !== "/" && pathname.startsWith(route.href));
                const Icon = route.icon;
                
                return (
                  <Link key={route.href} href={route.href}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{route.name}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-neon-blue rounded-full"
                        />
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Status Indicator */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-neon-green/20 rounded-full border border-neon-green/30">
                <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                <span className="text-xs text-neon-green font-medium">Online</span>
              </div>

              {/* Quick Actions */}
              <div className="hidden md:flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Search className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-neon-pink rounded-full animate-pulse" />
                </motion.button>
              </div>

              {/* Mobile Menu Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleMenu}
                className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-slate-950/98 backdrop-blur-md border-b border-white/10 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-6">
              {/* Main Routes */}
              <div className="space-y-2 mb-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
                  Main Navigation
                </h3>
                {mainRoutes.map((route) => {
                  const isActive = pathname === route.href || 
                    (route.href !== "/" && pathname.startsWith(route.href));
                  const Icon = route.icon;
                  
                  return (
                    <Link key={route.href} href={route.href} onClick={() => setIsOpen(false)}>
                      <motion.div
                        whileHover={{ x: 4 }}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <div>
                          <div className="font-medium">{route.name}</div>
                          <div className="text-xs text-gray-500">{route.description}</div>
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>

              {/* Admin Routes */}
              <div className="space-y-2 pt-4 border-t border-white/10">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
                  Advanced Features
                </h3>
                {adminRoutes.map((route) => {
                  const isActive = pathname === route.href;
                  const Icon = route.icon;
                  
                  return (
                    <Link key={route.href} href={route.href} onClick={() => setIsOpen(false)}>
                      <motion.div
                        whileHover={{ x: 4 }}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'
                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <div>
                          <div className="font-medium">{route.name}</div>
                          <div className="text-xs text-gray-500">{route.description}</div>
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>

              {/* Quick Links */}
              <div className="flex items-center gap-4 pt-6 border-t border-white/10 mt-6">
                <Link href="/pricing" onClick={() => setIsOpen(false)} className="text-sm text-gray-400 hover:text-neon-blue transition-colors">
                  Pricing
                </Link>
                <Link href="/legal" onClick={() => setIsOpen(false)} className="text-sm text-gray-400 hover:text-neon-blue transition-colors">
                  Legal
                </Link>
                <Link href="/content" onClick={() => setIsOpen(false)} className="text-sm text-gray-400 hover:text-neon-blue transition-colors">
                  Content
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}