import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className,
      )}
    >
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">🚀 [PROJECT]</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <Link
              href="/dashboard"
              className="px-3 py-2 text-sm font-medium hover:text-primary transition"
            >
              Dashboard
            </Link>
            <Link
              href="/settings"
              className="px-3 py-2 text-sm font-medium hover:text-primary transition"
            >
              Settings
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
