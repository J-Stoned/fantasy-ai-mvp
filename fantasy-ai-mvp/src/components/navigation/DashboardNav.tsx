"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Activity, 
  Brain, 
  Crown, 
  Globe, 
  Network, 
  Zap,
  BarChart3,
  Settings,
  Home
} from "lucide-react";

const dashboardRoutes = [
  {
    name: "Main Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Command center overview"
  },
  {
    name: "Revolutionary Analytics",
    href: "/dashboard/analytics", 
    icon: Zap,
    description: "Multi-modal AI analytics"
  },
  {
    name: "AI Systems",
    href: "/dashboard/ai-systems",
    icon: Brain,
    description: "Neural network monitoring"
  },
  {
    name: "MCP Infrastructure", 
    href: "/dashboard/mcp",
    icon: Network,
    description: "22 MCP servers monitoring"
  },
  {
    name: "Multi-Sport Universe",
    href: "/dashboard/multi-sport",
    icon: Globe,
    description: "Global sports expansion"
  },
  {
    name: "Admin Command",
    href: "/admin",
    icon: Crown,
    description: "Supreme control center"
  }
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-gradient-to-r from-slate-950/90 to-gray-900/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                Fantasy.AI
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              {dashboardRoutes.map((route) => {
                const isActive = pathname === route.href;
                const Icon = route.icon;
                
                return (
                  <Link key={route.href} href={route.href}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{route.name}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="w-1 h-1 bg-neon-blue rounded-full"
                        />
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-neon-green/20 rounded-full border border-neon-green/30">
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
              <span className="text-xs text-neon-green font-medium">All Systems Operational</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default DashboardNav;