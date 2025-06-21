"use client";

import { motion } from "framer-motion";

interface TextAnimateProps {
  children: string;
  className?: string;
  animation?: "slideUp" | "slideLeft" | "slideRight" | "fade";
}

export function TextAnimate({ 
  children, 
  className = "", 
  animation = "slideUp" 
}: TextAnimateProps) {
  const animations = {
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 }
    },
    slideLeft: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 }
    },
    slideRight: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 }
    },
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 }
    }
  };

  const selectedAnimation = animations[animation];

  return (
    <motion.div
      initial={selectedAnimation.initial}
      animate={selectedAnimation.animate}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}