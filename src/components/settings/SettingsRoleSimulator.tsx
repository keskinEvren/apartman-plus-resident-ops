"use client";

import React from "react";
import { User, Shield, UserCheck, RefreshCw, Check } from "lucide-react";

interface SettingsRoleSimulatorProps {
  currentRole: string;
  onSwap: (email: string, pass: string) => void;
  isPending: boolean;
}

export function SettingsRoleSimulator({
  currentRole,
  onSwap,
  isPending,
}: SettingsRoleSimulatorProps) {
  const simulatorRoles = [
    {
      title: "Kat Sakini (Resident)",
      email: "user@example.com",
      pass: "user123",
      icon: User,
      desc: "Daire A-1 (Rezervasyon, Ziyaretçi ve Kargo OTP görüntüleme)",
      isActive: currentRole === "RESIDENT",
    },
    {
      title: "Resepsiyon / Güvenlik (Staff)",
      email: "demo@example.com",
      pass: "user123",
      icon: UserCheck,
      desc: "A Blok Görevlisi (Ziyaretçi Kabul, Kargo Giriş & OTP Teslim ve Talepler)",
      isActive: currentRole === "STAFF",
    },
    {
      title: "Site Yöneticisi (Admin)",
      email: "admin@example.com",
      pass: "admin123",
      icon: Shield,
      desc: "Tam Yetkili Yönetici (Duyuru Yayınlama, Okunma Raporu ve Tüm Talepler)",
      isActive: currentRole === "SITE_ADMIN" || currentRole === "SUPER_ADMIN",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <RefreshCw className="h-4 w-4 text-primary" />
          Geliştirici Rol Değiştirici
        </h2>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Tüm operasyonel rolleri aynı tarayıcı sekmesinde test etmek için
          aşağıdaki kartlardan birine tıklayarak anında rol geçişi
          yapabilirsiniz.
        </p>
      </div>

      <div className="space-y-3 pt-2">
        {simulatorRoles.map((role) => {
          const Icon = role.icon;
          return (
            <div
              key={role.email}
              onClick={() => !isPending && onSwap(role.email, role.pass)}
              className={`bg-white rounded-lg p-4 border flex items-start gap-4 hover:bg-secondary cursor-pointer transition-all duration-200 relative ${
                role.isActive
                  ? "bg-primary/5 border-primary text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <div className="p-2 rounded-lg bg-muted shrink-0 mt-0.5">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 pr-8">
                <p className="text-xs font-bold text-foreground">
                  {role.title}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                  {role.desc}
                </p>
              </div>
              {role.isActive && (
                <span className="absolute top-4 right-4 h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
