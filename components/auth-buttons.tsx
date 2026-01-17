"use client";

import Link from "next/link";
import { LogIn, LogOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { handleSignIn, handleSignOut } from "@/app/auth-actions";

export function AuthButtons({ isSignedIn }: { isSignedIn: boolean }) {
  return isSignedIn ? (
    <div className="flex items-center gap-2">
      <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
        Dashboard
      </Link>
      <form action={handleSignOut}>
        <Button type="submit" variant="outline" className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </form>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Link href="/demo" className={buttonVariants({ variant: "outline" })}>
        Live Demo
      </Link>
      <form action={handleSignIn}>
        <Button type="submit" className="gap-2">
          <LogIn className="h-4 w-4" />
          Sign in with Google
        </Button>
      </form>
    </div>
  );
}
