"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface BlurFadeProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  blur?: string;
}

export function BlurFade({ 
  children, 
  className = "", 
  delay = 0,
  blur = "6px"
}: BlurFadeProps) {
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        filter: `blur(${blur})`,
        scale: 0.95
      }}
      animate={{ 
        opacity: 1, 
        filter: "blur(0px)",
        scale: 1
      }}
      transition={{ 
        duration: 0.7,
        delay,
        ease: "easeOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}