import { Card } from "@/components/ui/card";
import { AuthButtons } from "@/components/auth-buttons";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";
import { Sparkles } from "lucide-react";

type StatItem = {
  label: string;
  value: string | number;
  trend?: string;
};

export function PageHeader({
  userImage,
  userName,
  stats,
  isAdmin,
  isSignedIn = true,
}: {
  userImage?: string | null;
  userName?: string | null;
  stats: StatItem[];
  isAdmin?: boolean;
  isSignedIn?: boolean;
}) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto max-w-7xl">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-none sm:text-base">
                Cosmic Watchlist
              </h1>
              <p className="text-xs text-muted-foreground">
                {userName ? `Welcome, ${userName.split(' ')[0]}` : 'Track your favorites'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <kbd className="hidden rounded border bg-muted px-2 py-1 text-xs text-muted-foreground sm:inline-block">
              ⌘K
            </kbd>
            {userImage && (
              <div className="h-8 w-8 overflow-hidden rounded-full border">
                <Image
                  src={userImage}
                  alt={userName || "User"}
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <AuthButtons isSignedIn={isSignedIn} />
            {isAdmin && (
              <a
                href="/admin/feedback"
                className="text-xs text-primary hover:underline"
              >
                Admin
              </a>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        {stats.length > 0 && (
          <div className="border-t px-4 py-3 sm:px-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-1 rounded-lg border bg-card p-3"
                >
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-lg font-semibold sm:text-xl">{stat.value}</p>
                    {stat.trend && (
                      <span className="text-xs text-muted-foreground">{stat.trend}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
