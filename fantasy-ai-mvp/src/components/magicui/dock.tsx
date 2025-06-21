import { cva, type VariantProps } from "class-variance-authority";
import {
  motion,
  MotionProps,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import React, { PropsWithChildren, useRef } from "react";

import { cn } from "@/lib/utils";

export interface DockProps extends VariantProps<typeof dockVariants> {
  className?: string;
  iconSize?: number;
  iconMagnification?: number;
  iconDistance?: number;
  direction?: "top" | "middle" | "bottom";
  children: React.ReactNode;
}

const DEFAULT_SIZE = 40;
const DEFAULT_MAGNIFICATION = 60;
const DEFAULT_DISTANCE = 140;

const dockVariants = cva(
  "supports-backdrop-blur:bg-white/10 supports-backdrop-blur:dark:bg-black/10 mx-auto mt-8 flex h-[58px] w-max items-center justify-center gap-2 rounded-2xl border p-2 backdrop-blur-md",
);

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  (
    {
      className,
      children,
      iconSize = DEFAULT_SIZE,
      iconMagnification = DEFAULT_MAGNIFICATION,
      iconDistance = DEFAULT_DISTANCE,
      direction = "middle",
      ...props
    },
    ref,
  ) => {
    const mouseX = useMotionValue(Infinity);

    const renderChildren = () => {
      return React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === DockIcon) {
          return React.cloneElement(child, {
            ...(child.props as any),
            mouseX: mouseX,
            size: iconSize,
            magnification: iconMagnification,
            distance: iconDistance,
          });
        }
        return child;
      });
    };

    return (
      <motion.div
        ref={ref}
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        {...props}
        className={cn(dockVariants({ className }))}
        style={{
          position: "fixed",
          bottom: direction === "bottom" ? "24px" : undefined,
          top: direction === "top" ? "24px" : undefined,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
        }}
      >
        {renderChildren()}
      </motion.div>
    );
  },
);

Dock.displayName = "Dock";

export interface DockIconProps {
  size?: number;
  magnification?: number;
  distance?: number;
  mouseX?: any;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

const DockIcon = ({
  size = DEFAULT_SIZE,
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  mouseX,
  className,
  children,
  onClick,
  ...props
}: DockIconProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const distanceCalc = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  let widthSync = useTransform(
    distanceCalc,
    [-distance, 0, distance],
    [size, magnification, size],
  );

  let width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <motion.div
      ref={ref}
      style={{ width, height: width }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "flex aspect-square cursor-pointer items-center justify-center rounded-full",
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
};

DockIcon.displayName = "DockIcon";

// Simplified Dock for direct usage
export const SimpleDock = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md rounded-2xl p-3 border border-gray-700/50", className)}>
    <div className="flex items-center space-x-4">
      {children}
    </div>
  </div>
);

export { Dock, DockIcon };