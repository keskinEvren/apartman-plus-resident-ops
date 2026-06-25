import React from "react";
import Link from "next/link";
import {
  Building2,
  Lock,
  ShieldCheck,
  Package,
  Users,
  KeyRound,
  ArrowRight,
  Github,
} from "lucide-react";

/* ────────────────────────────────────────────────────────
   komşu.site — Portfolyo Showcase Landing Page
   Tasarım dili: Wiza-inspired light-mode lavender atmosfer
   ──────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: Building2,
    title: "Çoklu Mülk Mimarisi",
    description:
      "Bir kullanıcı birden fazla siteye ve daireye üye olabilir. x-membership-id header'ı ile tRPC context'e bağlanan multi-tenant yetkilendirme.",
  },
  {
    icon: Lock,
    title: "Concurrency-Safe Rezervasyon",
    description:
      "PostgreSQL SELECT FOR UPDATE ile satır seviyesinde kilitleme. Aynı anda gelen iki rezervasyon isteğinde kapasite aşımı kesinlikle engellenir.",
  },
  {
    icon: ShieldCheck,
    title: "Rol Bazlı Erişim Kontrolü",
    description:
      "Sakin, resepsiyon ve yönetici rolleri. Her API endpoint'inde permission kontrolü, RBAC korumalı admin profil inceleme modalı.",
  },
  {
    icon: Package,
    title: "OTP Kargo Teslimi",
    description:
      "Rezidansa gelen paketler güvenlik tarafından kaydedilir, sakine tek kullanımlık OTP kodu iletilir. Kod doğrulaması ile güvenli teslim.",
  },
  {
    icon: Users,
    title: "Ziyaretçi ve Destek Talepleri",
    description:
      "Ziyaretçi geçiş kartları, giriş/çıkış takibi, kategorili destek talepleri ve durum güncellemeleri ile tam operasyonel döngü.",
  },
  {
    icon: KeyRound,
    title: "Oturum Güvenliği",
    description:
      "JWT + veritabanı tabanlı hibrit oturum yönetimi. Aktif oturumları listeleme, şüpheli cihazları tek tıkla sonlandırma, şifre rotasyonu.",
  },
] as const;

const TECH_STACK = [
  "Next.js 15",
  "React 19",
  "tRPC v11",
  "PostgreSQL",
  "Drizzle ORM",
  "TypeScript",
  "Tailwind CSS",
] as const;

const DEMO_ROLES = [
  {
    role: "Kat Sakini",
    description: "Rezervasyon, kargo OTP, ziyaretçi kaydı ve destek talebi",
    badge: "Sakin",
  },
  {
    role: "Resepsiyon / Güvenlik",
    description: "Kargo kabul, OTP teslim, ziyaretçi giriş ve talep yönetimi",
    badge: "Personel",
  },
  {
    role: "Site Yöneticisi",
    description:
      "Duyuru yayınlama, okunma raporu, sakin yönetimi ve tam yetki",
    badge: "Admin",
  },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-[#333] font-body selection:bg-[#eeecff] selection:text-[#1e1145]">
      {/* ── Floating Nav ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#e5e2e8]">
        <nav className="mx-auto max-w-[1200px] px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/komsu.jpeg"
              alt="komşu"
              className="h-8 w-8 rounded-lg object-cover"
            />
            <span className="font-heading text-[17px] font-bold tracking-tight text-[#1e1145]">
              komşu
              <span className="text-[#4a1d96] font-medium">.site</span>
            </span>
          </Link>
          <Link
            href="/login"
            className="px-5 py-2 text-[13px] font-semibold rounded-lg bg-[#1e1145] text-white hover:bg-[#2a1a5e] transition-colors duration-200"
          >
            Canlı Demo
          </Link>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f3f1ff] to-[#eeecff] pointer-events-none" />
        <div className="relative mx-auto max-w-[1200px] px-6 pt-20 pb-24 text-center">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-semibold bg-[#eeecff] text-[#4a1d96] tracking-wide uppercase mb-6">
            Apartman Sakin Portalı
          </span>
          <h1 className="font-heading text-[clamp(32px,5vw,56px)] font-medium leading-[1] text-[#1e1145] tracking-tight max-w-3xl mx-auto">
            Apartman Yaşamını
            <br />
            Yeniden Tasarladık
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-[#625e6e] max-w-xl mx-auto">
            Kargo takibi, tesis rezervasyonu, ziyaretçi yönetimi ve destek
            talepleri. Sakinlerin günlük ihtiyaçlarını tek bir platformda
            çözen, production-grade bir B2B SaaS uygulaması.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-3">
            <Link
              href="/login"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 text-[14px] font-semibold rounded-lg bg-[#1e1145] text-white hover:bg-[#2a1a5e] transition-colors duration-200"
            >
              Canlı Demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="https://github.com/keskinEvren/apartman-plus-resident-ops"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 text-[14px] font-semibold rounded-lg border border-[#1e1145] text-[#1e1145] hover:bg-[#f3f1ff] transition-colors duration-200"
            >
              <Github className="h-4 w-4" />
              GitHub Repo
            </a>
          </div>
        </div>
      </section>

      {/* ── Feature Grid ── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="text-center mb-14">
            <span className="inline-flex items-center px-3.5 py-1 rounded-full text-[11px] font-semibold bg-[#eeecff] text-[#4a1d96] tracking-wide uppercase mb-4">
              Teknik Özellikler
            </span>
            <h2 className="font-heading text-[clamp(28px,4vw,40px)] font-medium leading-[1] text-[#1e1145] tracking-tight">
              Portfolyo Değil, Ürün Kalitesi
            </h2>
            <p className="mt-3 text-[15px] text-[#625e6e] max-w-lg mx-auto">
              Her feature production-grade mimari kararlarla inşa edildi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-lg border border-[#e5e2e8] bg-white p-6 hover:shadow-[rgba(14,59,101,0.06)_0px_32px_24px_-12px,rgba(14,59,101,0.01)_0px_11px_4px_0px,rgba(14,59,101,0.02)_0px_6px_4px_0px,rgba(14,59,101,0.03)_0px_3px_3px_0px,rgba(14,59,101,0.04)_0px_1px_1px_0px] hover:border-[#d5d2e8] transition-all duration-300"
              >
                <div className="h-10 w-10 rounded-lg bg-[#eeecff] flex items-center justify-center text-[#4a1d96] mb-4">
                  <f.icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="text-[15px] font-semibold text-[#1e1145] mb-1.5">
                  {f.title}
                </h3>
                <p className="text-[13px] leading-[1.55] text-[#625e6e]">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section className="bg-[#f7f6fa] py-16 border-y border-[#e5e2e8]">
        <div className="mx-auto max-w-[1200px] px-6 text-center">
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-[11px] font-semibold bg-[#eeecff] text-[#4a1d96] tracking-wide uppercase mb-4">
            Teknoloji Yığını
          </span>
          <div className="flex flex-wrap justify-center gap-2.5 mt-6">
            {TECH_STACK.map((tech) => (
              <span
                key={tech}
                className="px-4 py-1.5 rounded-full text-[13px] font-medium bg-white text-[#4a1d96] border border-[#e5e2e8] shadow-[rgba(18,55,105,0.08)_0px_2px_4px_0px,rgba(18,55,105,0.04)_0px_1px_1px_0px]"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Demo CTA ── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="text-center mb-12">
            <span className="inline-flex items-center px-3.5 py-1 rounded-full text-[11px] font-semibold bg-[#eeecff] text-[#4a1d96] tracking-wide uppercase mb-4">
              Canlı Demo
            </span>
            <h2 className="font-heading text-[clamp(28px,4vw,40px)] font-medium leading-[1] text-[#1e1145] tracking-tight">
              3 Farklı Rol ile Deneyin
            </h2>
            <p className="mt-3 text-[15px] text-[#625e6e] max-w-lg mx-auto">
              Demo hesapları hazır. Tek tıkla giriş yapın, her rolün ne
              görebildiğini keşfedin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {DEMO_ROLES.map((r) => (
              <Link
                key={r.role}
                href="/login"
                className="group rounded-lg border border-[#e5e2e8] bg-white p-6 text-left hover:border-[#c5b8f0] hover:shadow-[rgba(47,1,151,0.01)_0px_11px_4px_0px,rgba(47,1,151,0.04)_0px_6px_4px_0px,rgba(47,1,151,0.06)_0px_3px_3px_0px,rgba(47,1,151,0.08)_0px_1px_1px_0px,rgba(47,1,151,0.08)_0px_0px_0px_1px] transition-all duration-300"
              >
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#eeecff] text-[#4a1d96] tracking-wide uppercase mb-3">
                  {r.badge}
                </span>
                <h3 className="text-[15px] font-semibold text-[#1e1145] mb-1">
                  {r.role}
                </h3>
                <p className="text-[12px] leading-[1.5] text-[#948fa1] mb-3">
                  {r.description}
                </p>
                <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#4a1d96] group-hover:gap-2 transition-all duration-200">
                  Dene
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#f7f6fa] border-t border-[#e5e2e8] py-8">
        <div className="mx-auto max-w-[1200px] px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#948fa1]">
          <span>
            &copy; {new Date().getFullYear()} komşu.site
          </span>
          <div className="flex items-center gap-4">
            <span>Built by Evren Keskin</span>
            <a
              href="https://github.com/keskinEvren/apartman-plus-resident-ops"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#625e6e] hover:text-[#1e1145] transition-colors"
            >
              <Github className="h-3.5 w-3.5" />
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
