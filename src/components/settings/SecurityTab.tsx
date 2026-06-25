"use client";

import React from "react";
import { PasswordChangeCard } from "./PasswordChangeCard";
import { SessionManagerCard } from "./SessionManagerCard";
import { Shield } from "lucide-react";

export function SecurityTab() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2">
        <Shield className="h-4.5 w-4.5 text-primary" />
        Hesap Güvenliği ve Erişim Kontrolü
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <PasswordChangeCard />
        </div>
        <div className="lg:col-span-7">
          <SessionManagerCard />
        </div>
      </div>
    </div>
  );
}
