"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  className?: string;
  label?: string;
}

export function FloatingActionButton({
  icon,
  onClick,
  className,
  label,
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-24 right-6 z-30 w-14 h-14 rounded-full",
        "bg-primary",
        "shadow-lg shadow-primary/50 hover:shadow-primary/75",
        "flex items-center justify-center text-white font-bold text-xl",
        "transition-all duration-300 hover:scale-110 active:scale-95",
        "backdrop-blur-md border border-white/20",
        className
      )}
      title={label}
    >
      {icon}
    </button>
  );
}
