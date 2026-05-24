"use client";

import React from "react";
import { User, Shield, UserCheck } from "lucide-react";

interface RoleSimulatorProps {
  onSelect: (email: string, pass: string) => void;
}

export function RoleSimulator({ onSelect }: RoleSimulatorProps) {
  const simulatorRoles = [
    {
      title: "Kat Sakini",
      email: "user@example.com",
      pass: "user123",
      icon: User,
      desc: "Daire A-1 (Rezervasyon, Ziyaretçi ve Kargo OTP görüntüleme)",
      color:
        "from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400",
    },
    {
      title: "Resepsiyon / Güvenlik",
      email: "demo@example.com",
      pass: "user123",
      icon: UserCheck,
      desc: "A Blok Görevlisi (Ziyaretçi Kabul, Kargo Giriş & OTP Teslim ve Talepler)",
      color:
        "from-teal-500/20 to-emerald-500/20 border-teal-500/30 text-teal-400",
    },
    {
      title: "Site Yöneticisi",
      email: "admin@example.com",
      pass: "admin123",
      icon: Shield,
      desc: "Tam Yetkili Yönetici (Duyuru Yayınlama, Okunma Raporu ve Tüm Talepler)",
      color:
        "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400",
    },
  ];

  return (
    <div className="space-y-3 pt-4">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
        Geliştirici Rol Simülatörü (Tek Tıkla Giriş)
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
        {simulatorRoles.map((role) => {
          const Icon = role.icon;
          return (
            <div
              key={role.email}
              onClick={() => onSelect(role.email, role.pass)}
              className={`glass-surface rounded-2xl p-4 border flex items-start gap-4 hover:scale-[1.01] hover:bg-white/[0.04] cursor-pointer transition-all duration-200 ${role.color}`}
            >
              <div className="p-2 rounded-xl bg-white/[0.05] shrink-0 mt-0.5">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">
                  {role.title}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  {role.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
