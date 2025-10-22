"use client";

import { GlassCard } from "@/components/glass-card";
import { StatCard } from "@/components/stat-card";
import { BottomNav } from "@/components/bottom-nav";

function ProfilePage() {
  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-20 pt-4 px-4 pb-6 bg-background animate-fade-in">
        <div className="flex items-end gap-4 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-4xl font-bold text-primary-foreground animate-subtle-bounce">
            A
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Alex Runner</h1>
            <p className="text-sm text-muted-foreground">
              @alexrunner • Level 12
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Total Distance" value="342km" icon="D" />
          <StatCard label="Territories" value="28" icon="T" />
          <StatCard label="Current Rank" value="#42" icon="R" />
          <StatCard label="Clan Rank" value="#8" icon="C" />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Achievements */}
        <div className="animate-scale-in">
          <h2 className="text-lg font-bold text-foreground mb-3">
            Achievements
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: "1", label: "First Blood" },
              { icon: "F", label: "On Fire" },
              { icon: "E", label: "Explorer" },
              { icon: "S", label: "Speedster" },
              { icon: "C", label: "Champion" },
              { icon: "P", label: "Precision" },
              { icon: "R", label: "Rocket" },
              { icon: "D", label: "Diamond" },
            ].map((achievement, idx) => (
              <GlassCard
                key={idx}
                className="p-3 flex flex-col items-center justify-center text-center card-hover"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="text-2xl mb-1 font-bold text-primary">
                  {achievement.icon}
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  {achievement.label}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
        {/* Personal Records */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">
            Personal Records
          </h2>
          <div className="space-y-3">
            {[
              { label: "Longest Run", value: "18.5km", date: "Oct 15, 2025" },
              { label: "Most Territories", value: "12", date: "Oct 10, 2025" },
              {
                label: "Fastest Capture",
                value: "2:34min",
                date: "Oct 8, 2025",
              },
            ].map((record, idx) => (
              <GlassCard
                key={idx}
                className="p-4 card-hover"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {record.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {record.date}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-primary">
                    {record.value}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
        {/* Activity Timeline */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">
            Recent Activity
          </h2>
          <div className="space-y-2">
            {[
              {
                action: "Captured Downtown District",
                time: "2 hours ago",
                icon: "+",
              },
              { action: "Lost Riverside Park", time: "5 hours ago", icon: "-" },
              {
                action: "Joined Shadow Ops Clan",
                time: "1 day ago",
                icon: "J",
              },
              { action: "Reached Level 12", time: "2 days ago", icon: "L" },
            ].map((activity, idx) => (
              <GlassCard
                key={idx}
                className="p-3 flex items-center gap-3 card-hover"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-white/10">
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.time}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
        {/* Settings */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">Settings</h2>
          <div className="space-y-2">
            {[
              { label: "Notifications", icon: "N" },
              { label: "Privacy", icon: "P" },
              { label: "About", icon: "A" },
              { label: "Logout", icon: "L" },
            ].map((setting, idx) => (
              <GlassCard
                key={idx}
                className="p-4 cursor-pointer hover:bg-white/15 transition-all flex items-center justify-between card-hover"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-primary">
                    {setting.icon}
                  </span>
                  <span className="font-medium text-foreground">
                    {setting.label}
                  </span>
                </div>
                <span className="text-muted-foreground">›</span>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>

      <BottomNav
        items={[
          { href: "/", label: "Map", icon: "M" },
          { href: "/clans", label: "Clans", icon: "C" },
          { href: "/profile", label: "Profile", icon: "P", active: true },
        ]}
      />
    </main>
  );
}

export default ProfilePage;
