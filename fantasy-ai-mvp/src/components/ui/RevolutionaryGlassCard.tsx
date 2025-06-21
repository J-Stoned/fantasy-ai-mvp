/**
 * Revolutionary Glass Card Component - Fantasy.AI Ultimate UI
 * Stunning glass effects with neon borders and fluid animations
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface RevolutionaryGlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "premium" | "elite" | "legendary";
  neonColor?: "blue" | "purple" | "green" | "gold" | "red" | "cyan";
  animated?: boolean;
  hover3D?: boolean;
  glowIntensity?: "subtle" | "medium" | "intense" | "ultimate";
  backgroundPattern?: "dots" | "grid" | "waves" | "neural" | "none";
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  pulse?: boolean;
  data?: any; // For data-driven animations
}

const neonColors = {
  blue: {
    primary: "rgba(59, 130, 246, 0.8)",
    secondary: "rgba(147, 197, 253, 0.6)",
    shadow: "rgba(59, 130, 246, 0.4)",
    gradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.05))"
  },
  purple: {
    primary: "rgba(147, 51, 234, 0.8)",
    secondary: "rgba(196, 181, 253, 0.6)",
    shadow: "rgba(147, 51, 234, 0.4)",
    gradient: "linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(196, 181, 253, 0.05))"
  },
  green: {
    primary: "rgba(34, 197, 94, 0.8)",
    secondary: "rgba(134, 239, 172, 0.6)",
    shadow: "rgba(34, 197, 94, 0.4)",
    gradient: "linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(134, 239, 172, 0.05))"
  },
  gold: {
    primary: "rgba(245, 158, 11, 0.8)",
    secondary: "rgba(253, 224, 71, 0.6)",
    shadow: "rgba(245, 158, 11, 0.4)",
    gradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(253, 224, 71, 0.05))"
  },
  red: {
    primary: "rgba(239, 68, 68, 0.8)",
    secondary: "rgba(252, 165, 165, 0.6)",
    shadow: "rgba(239, 68, 68, 0.4)",
    gradient: "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(252, 165, 165, 0.05))"
  },
  cyan: {
    primary: "rgba(6, 182, 212, 0.8)",
    secondary: "rgba(103, 232, 249, 0.6)",
    shadow: "rgba(6, 182, 212, 0.4)",
    gradient: "linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(103, 232, 249, 0.05))"
  }
};

const backgroundPatterns = {
  dots: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
  grid: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
  waves: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  neural: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  none: "none"
};

export function RevolutionaryGlassCard({
  children,
  className,
  variant = "default",
  neonColor = "blue",
  animated = true,
  hover3D = true,
  glowIntensity = "medium",
  backgroundPattern = "none",
  onClick,
  disabled = false,
  loading = false,
  pulse = false,
  data
}: RevolutionaryGlassCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const colors = neonColors[neonColor];
  const pattern = backgroundPatterns[backgroundPattern];

  // Handle mouse movement for 3D effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hover3D) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setMousePosition({ x, y });
  };

  // Calculate 3D transform
  const get3DTransform = () => {
    if (!hover3D || !isHovered) return "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    
    const rotateX = (mousePosition.y - 0.5) * 10;
    const rotateY = (mousePosition.x - 0.5) * -10;
    
    return `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
  };

  // Get glow styles based on intensity
  const getGlowStyles = () => {
    const intensityMap = {
      subtle: { blur: "4px", spread: "2px", opacity: 0.3 },
      medium: { blur: "8px", spread: "4px", opacity: 0.5 },
      intense: { blur: "16px", spread: "8px", opacity: 0.7 },
      ultimate: { blur: "24px", spread: "12px", opacity: 0.9 }
    };

    const intensity = intensityMap[glowIntensity];
    
    return {
      boxShadow: `
        0 0 ${intensity.blur} ${intensity.spread} ${colors.shadow},
        inset 0 1px 2px rgba(255, 255, 255, 0.1),
        inset 0 -1px 2px rgba(0, 0, 0, 0.1)
      `,
      filter: isHovered ? `brightness(1.1) saturate(1.2)` : "brightness(1) saturate(1)"
    };
  };

  // Variant-specific styles
  const getVariantStyles = () => {
    const variants = {
      default: {
        background: `${colors.gradient}, rgba(255, 255, 255, 0.05)`,
        border: `1px solid ${colors.primary}`,
        backdropFilter: "blur(12px)",
      },
      premium: {
        background: `${colors.gradient}, rgba(255, 255, 255, 0.08)`,
        border: `2px solid ${colors.primary}`,
        backdropFilter: "blur(16px)",
      },
      elite: {
        background: `${colors.gradient}, rgba(255, 255, 255, 0.12)`,
        border: `3px solid ${colors.primary}`,
        backdropFilter: "blur(20px)",
      },
      legendary: {
        background: `
          ${colors.gradient},
          linear-gradient(45deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.05)),
          rgba(255, 255, 255, 0.15)
        `,
        border: `4px solid ${colors.primary}`,
        backdropFilter: "blur(24px)",
      }
    };

    return variants[variant];
  };

  const variantStyles = getVariantStyles();
  const glowStyles = getGlowStyles();

  return (
    <motion.div
      className={cn(
        "relative rounded-2xl overflow-hidden cursor-pointer select-none",
        "transition-all duration-300 ease-out",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      style={{
        background: variantStyles.background,
        border: variantStyles.border,
        backdropFilter: variantStyles.backdropFilter,
        backgroundImage: pattern !== "none" ? pattern : undefined,
        backgroundSize: pattern === "dots" ? "20px 20px" : pattern === "grid" ? "20px 20px" : "40px 40px",
        transform: get3DTransform(),
        ...glowStyles,
      }}
      animate={{
        scale: isPressed ? 0.98 : isHovered ? 1.02 : 1,
        rotateZ: pulse ? [0, 0.5, 0, -0.5, 0] : 0,
      }}
      transition={{
        duration: 0.2,
        ease: "easeOut",
        scale: { duration: 0.1 },
        rotateZ: pulse ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : { duration: 0 }
      }}
      whileHover={animated ? { scale: 1.02 } : {}}
      whileTap={animated ? { scale: 0.98 } : {}}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePosition({ x: 0, y: 0 });
      }}
      onMouseMove={handleMouseMove}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={disabled ? undefined : onClick}
    >
      {/* Shimmer effect overlay */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: `linear-gradient(
            45deg,
            transparent 30%, 
            rgba(255, 255, 255, 0.1) 50%, 
            transparent 70%
          )`,
          transform: "translateX(-100%)",
        }}
        animate={isHovered ? { transform: "translateX(100%)" } : { transform: "translateX(-100%)" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />

      {/* Data-driven pulse effect */}
      {data && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `radial-gradient(circle at center, ${colors.primary} 0%, transparent 70%)`,
            opacity: 0,
          }}
          animate={{
            opacity: [0, 0.2, 0],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Loading spinner */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-8 h-8 border-2 border-transparent rounded-full"
              style={{
                borderTopColor: colors.primary,
                borderRightColor: colors.secondary,
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corner accents */}
      <div
        className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 rounded-tl-2xl"
        style={{ borderColor: colors.secondary }}
      />
      <div
        className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 rounded-tr-2xl"
        style={{ borderColor: colors.secondary }}
      />
      <div
        className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 rounded-bl-2xl"
        style={{ borderColor: colors.secondary }}
      />
      <div
        className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 rounded-br-2xl"
        style={{ borderColor: colors.secondary }}
      />

      {/* Content */}
      <div className="relative z-10 p-6">
        {children}
      </div>
    </motion.div>
  );
}

// Specialized variants for different use cases
export function PlayerCard({ children, ...props }: RevolutionaryGlassCardProps) {
  return (
    <RevolutionaryGlassCard
      variant="premium"
      neonColor="blue"
      backgroundPattern="neural"
      hover3D
      animated
      {...props}
    >
      {children}
    </RevolutionaryGlassCard>
  );
}

export function PredictionCard({ children, confidence, ...props }: RevolutionaryGlassCardProps & { confidence?: number }) {
  const getColorByConfidence = (conf: number = 0.5) => {
    if (conf >= 0.9) return "gold";
    if (conf >= 0.8) return "green";
    if (conf >= 0.7) return "cyan";
    if (conf >= 0.6) return "blue";
    if (conf >= 0.5) return "purple";
    return "red";
  };

  return (
    <RevolutionaryGlassCard
      variant="elite"
      neonColor={getColorByConfidence(confidence)}
      backgroundPattern="waves"
      glowIntensity="intense"
      pulse={!!(confidence && confidence > 0.9)}
      data={{ confidence }}
      {...props}
    >
      {children}
    </RevolutionaryGlassCard>
  );
}

export function DashboardCard({ children, ...props }: RevolutionaryGlassCardProps) {
  return (
    <RevolutionaryGlassCard
      variant="default"
      neonColor="cyan"
      backgroundPattern="grid"
      glowIntensity="subtle"
      {...props}
    >
      {children}
    </RevolutionaryGlassCard>
  );
}

export function EliteInsightCard({ children, ...props }: RevolutionaryGlassCardProps) {
  return (
    <RevolutionaryGlassCard
      variant="legendary"
      neonColor="gold"
      backgroundPattern="neural"
      glowIntensity="ultimate"
      hover3D
      pulse
      {...props}
    >
      {children}
    </RevolutionaryGlassCard>
  );
}