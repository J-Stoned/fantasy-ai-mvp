"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedGradientTextProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedGradientText({ children, className = "" }: AnimatedGradientTextProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink bg-clip-text text-transparent ${className}`}
      style={{
        backgroundSize: "200% 200%",
        animation: "gradient-x 3s ease infinite"
      }}
    >
      {children}
      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </motion.div>
  );
}