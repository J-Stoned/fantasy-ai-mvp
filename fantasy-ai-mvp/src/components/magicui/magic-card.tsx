"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import React, { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface MagicCardProps {
  children?: React.ReactNode;
  className?: string;
  gradientSize?: number;
  gradientColor?: string;
  gradientOpacity?: number;
  gradientFrom?: string;
  gradientTo?: string;
}

export function MagicCard({
  children,
  className,
  gradientSize = 200,
  gradientColor = "#262626",
  gradientOpacity = 0.8,
  gradientFrom = "#9E7AFF",
  gradientTo = "#FE8BBB",
}: MagicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-gradientSize);
  const mouseY = useMotionValue(-gradientSize);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (cardRef.current) {
        const { left, top } = cardRef.current.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
      }
    },
    [mouseX, mouseY]
  );

  const handleMouseOut = useCallback(
    (e: MouseEvent) => {
      if (!e.relatedTarget) {
        document.removeEventListener("mousemove", handleMouseMove);
        mouseX.set(-gradientSize);
        mouseY.set(-gradientSize);
      }
    },
    [handleMouseMove, mouseX, gradientSize, mouseY]
  );

  const handleMouseEnter = useCallback(() => {
    document.addEventListener("mousemove", handleMouseMove);
    mouseX.set(-gradientSize);
    mouseY.set(-gradientSize);
  }, [handleMouseMove, mouseX, mouseY, gradientSize]);

  useEffect(() => {
    const current = cardRef.current;
    if (current) {
      current.addEventListener("mouseenter", handleMouseEnter);
      current.addEventListener("mouseleave", handleMouseOut);
      return () => {
        current.removeEventListener("mouseenter", handleMouseEnter);
        current.removeEventListener("mouseleave", handleMouseOut);
      };
    }
  }, [handleMouseEnter, handleMouseOut]);

  useEffect(() => {
    mouseX.set(-gradientSize);
    mouseY.set(-gradientSize);
  }, [gradientSize, mouseX, mouseY]);

  const maskImage = useMotionTemplate`radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = {
    maskImage,
    WebkitMaskImage: maskImage,
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-sm",
        className
      )}
    >
      <div className="relative p-6">
        {children}
      </div>
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(${gradientSize}px circle at var(--mouse-x) var(--mouse-y), ${gradientFrom}, ${gradientTo}, transparent 40%)`,
          ...style,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
}