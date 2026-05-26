import React from "react";
import Link from "next/link";
import {
  Truck,
  CalendarDays,
  Megaphone,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A0D14] text-foreground flex flex-col justify-between relative overflow-hidden select-none">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="container mx-auto px-6 py-5 flex items-center justify-between border-b border-white/[0.04] z-10">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center shadow-glow text-white font-bold text-lg font-heading">
            K
          </div>
          <span className="font-heading text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            komşu<span className="text-primary font-medium">.site</span>
          </span>
        </div>
        <Link
          href="/login"
          className="px-4.5 py-2 text-xs font-semibold rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:text-foreground transition-all duration-200"
        >
          Giriş Yap
        </Link>
      </header>

      {/* Main Content Hero */}
      <main className="container mx-auto px-6 py-12 flex-1 flex flex-col justify-center items-center z-10 max-w-5xl">
        <div className="text-center space-y-5 max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-primary/10 border border-primary/20 text-primary uppercase tracking-widest animate-pulse">
            Apartman & Site Dijital Asistanı
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent font-heading">
            Apartman Yaşamında <br className="hidden sm:inline" /> Yeni Nesil
            Dijital Dönem
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
            Komşu.site ile dairenize gelen kargoları güvenle takip edin, tesis
            rezervasyonlarınızı anında yapın ve sitenizdeki duyurulardan anında
            haberdar olun.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition flex items-center justify-center gap-2 shadow-glow group"
            >
              Hemen Başla
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-white/[0.06] text-xs font-bold transition flex items-center justify-center"
            >
              Yönetim Paneli
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full">
          <FeatureCard
            icon={Truck}
            color="text-amber-400"
            bgColor="bg-amber-500/10"
            title="Akıllı Kargo Takip"
            description="Rezidansa gelen paketleriniz güvenlikle kaydedilir, size anlık OTP kodu iletilir. Güvenli teslimat sağlanır."
          />
          <FeatureCard
            icon={CalendarDays}
            color="text-primary"
            bgColor="bg-primary/10"
            title="Tesis Rezervasyonu"
            description="Spor salonu, havuz veya sosyal alanları doluluk oranlarına göre inceleyin, mobil jestlerle seansınızı ayırtın."
          />
          <FeatureCard
            icon={Megaphone}
            color="text-emerald-400"
            bgColor="bg-emerald-500/10"
            title="Anlık Duyurular"
            description="Yönetimden sakinlere iletilen genel, önemli ve acil durum duyurularına anında erişin ve kolayca takip edin."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-6 z-10 bg-black/10">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-muted-foreground/60 font-medium">
          <span>
            &copy; {new Date().getFullYear()} komsu.site. Tüm hakları saklıdır.
          </span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground transition">
              Kullanım Koşulları
            </a>
            <a href="#" className="hover:text-foreground transition">
              Gizlilik Politikası
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  title: string;
  description: string;
}

function FeatureCard({
  icon: Icon,
  color,
  bgColor,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="relative rounded-2xl border border-white/[0.05] bg-[#101420]/50 p-6 flex flex-col gap-4 backdrop-blur-md select-none hover:border-white/[0.1] hover:bg-[#101420]/75 transition-all duration-300">
      <div
        className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${bgColor} ${color}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground/80 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
