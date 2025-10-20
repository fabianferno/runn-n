"use client";

import type { ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "default" | "sm" | "interactive";
  style?: CSSProperties;
}

export function GlassCard({
  children,
  className,
  onClick,
  variant = "default",
  style,
}: GlassCardProps) {
  const baseStyles =
    "backdrop-blur-md border rounded-2xl transition-all duration-300";

  const variants = {
    default: "bg-white/10 border-white/20",
    sm: "bg-white/5 border-white/10 rounded-xl",
    interactive:
      "bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30 cursor-pointer active:scale-95",
  };

  return (
    <div
      className={cn(baseStyles, variants[variant], className)}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}
