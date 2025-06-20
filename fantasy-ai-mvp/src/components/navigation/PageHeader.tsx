"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Breadcrumbs } from "./Breadcrumbs";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  showBack?: boolean;
  className?: string;
}

export function PageHeader({ 
  title, 
  description, 
  icon, 
  actions, 
  showBack = false,
  className = "" 
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className={`bg-slate-950/50 backdrop-blur-md border-b border-white/10 sticky top-16 z-40 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <Breadcrumbs className="mb-4" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            {showBack && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
            )}
            
            {/* Icon */}
            {icon && (
              <div className="w-12 h-12 bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 rounded-xl flex items-center justify-center border border-white/10">
                {icon}
              </div>
            )}
            
            {/* Title & Description */}
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl md:text-3xl font-bold text-white"
              >
                {title}
              </motion.h1>
              {description && (
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-gray-400 mt-1"
                >
                  {description}
                </motion.p>
              )}
            </div>
          </div>
          
          {/* Actions */}
          {actions && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3"
            >
              {actions}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}