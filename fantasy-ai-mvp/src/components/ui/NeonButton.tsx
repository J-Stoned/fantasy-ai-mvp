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
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "btn btn-primary neon-border",
          size === "sm" && "text-sm px-4 py-2",
          size === "md" && "px-6 py-3",
          size === "lg" && "text-lg px-8 py-4",
          variant === "blue" && "text-blue",
          variant === "purple" && "text-purple", 
          variant === "pink" && "text-blue",
          variant === "green" && "text-blue",
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

NeonButton.displayName = "NeonButton";