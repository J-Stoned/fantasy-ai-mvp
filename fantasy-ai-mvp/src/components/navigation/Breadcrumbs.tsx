"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  name: string;
  href: string;
  current: boolean;
}

const routeMap: Record<string, string> = {
  "/": "Home",
  "/dashboard": "Dashboard",
  "/dashboard/analytics": "Analytics",
  "/dashboard/ai-systems": "AI Systems",
  "/dashboard/mcp": "MCP Infrastructure",
  "/dashboard/multi-sport": "Multi-Sport",
  "/admin": "Admin Panel",
  "/betting": "Live Betting",
  "/dfs": "Daily Fantasy",
  "/draft": "Draft Center",
  "/social": "Social Hub",
  "/sports": "Sports Center",
  "/content": "Content Hub",
  "/pricing": "Pricing",
  "/legal": "Legal",
  "/auth/signin": "Sign In",
  "/auth/signup": "Sign Up"
};

export function Breadcrumbs({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  
  // Don't show breadcrumbs on homepage
  if (pathname === "/") return null;

  const pathSegments = pathname.split("/").filter(Boolean);
  
  const breadcrumbs: BreadcrumbItem[] = [
    { name: "Home", href: "/", current: false }
  ];

  let currentPath = "";
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;
    
    breadcrumbs.push({
      name: routeMap[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1),
      href: currentPath,
      current: isLast
    });
  });

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`}>
      {breadcrumbs.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-500 mx-1" />
          )}
          
          {item.current ? (
            <span className="text-white font-medium">
              {item.name}
            </span>
          ) : (
            <Link href={item.href}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-1 text-gray-400 hover:text-neon-blue transition-colors px-2 py-1 rounded hover:bg-white/5"
              >
                {index === 0 && <Home className="w-3 h-3" />}
                <span>{item.name}</span>
              </motion.div>
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}