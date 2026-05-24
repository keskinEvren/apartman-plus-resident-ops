import React from "react";
import { RoleSimulator } from "./RoleSimulator";

interface LoginHeroProps {
  onSelect: (email: string, pass: string) => void;
}

export function LoginHero({ onSelect }: LoginHeroProps) {
  return (
    <div className="lg:col-span-7 flex flex-col justify-center text-left space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-base font-bold shadow-glow">
          A+
        </div>
        <span className="font-heading text-2xl font-bold bg-gradient-to-r from-primary via-purple-400 to-accent bg-clip-text text-transparent">
          Apartman Plus
        </span>
      </div>
      <div className="space-y-4">
        <h1 className="font-heading text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
          Rezidans Yaşam Operasyonlarını{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Yeniden Hayal Edin
          </span>
        </h1>
        <p className="text-muted-foreground text-base max-w-lg leading-relaxed">
          Ziyaretçiler, paket teslimatları, ortak alan rezervasyonları ve destek
          talepleri. Hepsi tek bir premium dark-glassmorphism panelde, entegre
          ve yüksek güvenlikli.
        </p>
      </div>

      <RoleSimulator onSelect={onSelect} />
    </div>
  );
}
