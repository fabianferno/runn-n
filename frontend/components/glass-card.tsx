"use client";

import type { ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  variant?: "default" | "sm" | "interactive";
  style?: CSSProperties;
}

export function GlassCard({
  children,
  className,
  onClick,
  onTouchEnd,
  variant = "default",
  style,
}: GlassCardProps) {
  const baseStyles =
    "rounded-2xl transition-all duration-300 relative";

  const variants = {
    default: "neumorphic-card",
    sm: "neumorphic-card rounded-xl",
    interactive:
      "neumorphic cursor-pointer",
  };

  return (
    <div
      className={cn(baseStyles, variants[variant], className)}
      onClick={onClick}
      onTouchEnd={onTouchEnd}
      style={style}
    >
      {children}
    </div>
  );
}
