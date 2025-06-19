"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  delay?: number;
  [key: string]: any;
}

export function GlassCard({ 
  children, 
  className, 
  hover = true, 
  glow = false,
  delay = 0,
  ...props
}: GlassCardProps) {
  const { onDrag, onDragStart, onDragEnd, ...htmlProps } = props;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover ? { scale: 1.02 } : undefined}
      className={cn(
        "glass rounded-xl p-6",
        glow && "shadow-neon animate-pulse-neon",
        className
      )}
      {...htmlProps}
    >
      {children}
    </motion.div>
  );
}