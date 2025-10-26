"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Goal, Zap, Trophy, TrendingUp, User } from "lucide-react";

const navItems = [
  { href: "/quests", icon: Goal, label: "Quests", id: "quests" },
  {
    href: "/leaderboard",
    icon: Trophy,
    label: "Leaderboard",
    id: "leaderboard",
  },
  { href: "/run", icon: Zap, label: "Run", id: "run" },

  { href: "/stats", icon: TrendingUp, label: "Stats", id: "stats" },
  { href: "/profile", icon: User, label: "Profile", id: "profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide nav on splash page
  if (pathname === "/") {
    return null;
  }

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="bottom-nav bg-card border-t border-border neumorphic-inset mb-3"
    >
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.id} href={item.href} className="relative flex-1">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-300 w-full ${
                  isActive
                    ? "text-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {/* Neumorphic background for active state */}
                {isActive && (
                  <motion.div
                    layoutId="activeBackground"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: "linear-gradient(145deg, #1f2540, #141a2a)",
                      boxShadow: `
                        inset 4px 4px 8px rgba(0, 0, 0, 0.8),
                        inset -2px -2px 4px rgba(255, 255, 255, 0.1),
                        0 0 0 2px rgba(204, 255, 0, 0.3)
                      `,
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}

                {/* Icon with enhanced styling */}
                <div className="relative z-10">
                  <Icon
                    className={`w-6 h-6 transition-all duration-300 ${
                      isActive ? "drop-shadow-lg mb-1" : ""
                    }`}
                  />
                </div>

                {/* Label with enhanced styling - only show for active item */}
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="text-xs font-semibold relative z-10 transition-all duration-300 text-accent drop-shadow-sm"
                  >
                    {item.label}
                  </motion.span>
                )}

                {/* Subtle glow effect for active state */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background:
                        "radial-gradient(circle at center, rgba(204, 255, 0, 0.1) 0%, transparent 70%)",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.button>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
