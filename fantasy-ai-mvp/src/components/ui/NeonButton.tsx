"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface NeonButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  variant?: "blue" | "purple" | "pink" | "green";
  size?: "sm" | "md" | "lg";
}

export const NeonButton = forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ className, variant = "blue", size = "md", children, ...props }, ref) => {
    const variants = {
      blue: "bg-neon-blue/10 border-neon-blue text-neon-blue hover:bg-neon-blue/20 shadow-[0_0_20px_rgba(0,217,255,0.5)]",
      purple: "bg-neon-purple/10 border-neon-purple text-neon-purple hover:bg-neon-purple/20 shadow-[0_0_20px_rgba(147,51,234,0.5)]",
      pink: "bg-neon-pink/10 border-neon-pink text-neon-pink hover:bg-neon-pink/20 shadow-[0_0_20px_rgba(236,72,153,0.5)]",
      green: "bg-neon-green/10 border-neon-green text-neon-green hover:bg-neon-green/20 shadow-[0_0_20px_rgba(16,185,129,0.5)]",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2",
      lg: "px-6 py-3 text-lg",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative border rounded-lg font-medium transition-all duration-300",
          "backdrop-blur-sm hover:shadow-lg",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        <span className="relative z-10">{children}</span>
        <div className="absolute inset-0 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div className={cn(
            "absolute inset-0 rounded-lg blur-xl",
            variant === "blue" && "bg-neon-blue/20",
            variant === "purple" && "bg-neon-purple/20",
            variant === "pink" && "bg-neon-pink/20",
            variant === "green" && "bg-neon-green/20"
          )} />
        </div>
      </motion.button>
    );
  }
);

NeonButton.displayName = "NeonButton";