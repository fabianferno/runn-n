"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlassCard } from "./glass-card";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  active?: boolean;
}

interface BottomNavProps {
  items: NavItem[];
}

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4">
      <GlassCard className="p-3 flex justify-around items-center">
        {items.map((item) => {
          const isActive = pathname === item.href || item.active;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-300",
                isActive
                  ? "text-primary bg-white/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </GlassCard>
    </div>
  );
}
