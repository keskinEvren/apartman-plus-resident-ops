"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { GlassCard } from "@/components/shared/GlassCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { LoginHero } from "@/components/login/LoginHero";
import { InvitationJoinCard } from "@/components/login/InvitationJoinCard";
import { User, KeyRound, Building2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showJoinCode, setShowJoinCode] = useState(false);

  useEffect(() => {
    localStorage.removeItem("auth-token");
    localStorage.removeItem("active-site-id");
  }, []);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("auth-token", data.token);
      if (data.memberships && data.memberships.length > 0) {
        localStorage.setItem("active-site-id", data.memberships[0].siteId);
      }
      showToast("success", `Hoş geldiniz, ${data.user.name}!`);
      router.push("/dashboard");
    },
    onError: (err) => {
      setError(
        err.message || "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.",
      );
      showToast("error", err.message || "Giriş yapılamadı");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("E-posta ve şifre gereklidir.");
      return;
    }
    loginMutation.mutate({ email, password });
  };

  const handleSimulatedLogin = (roleEmail: string, rolePass: string) => {
    setError("");
    setEmail(roleEmail);
    setPassword(rolePass);
    loginMutation.mutate({ email: roleEmail, password: rolePass });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        <LoginHero onSelect={handleSimulatedLogin} />

        <div className="lg:col-span-5 flex flex-col justify-center">
          <GlassCard className="gradient-border p-8 space-y-6">
            {showJoinCode ? (
              <InvitationJoinCard onBack={() => setShowJoinCode(false)} />
            ) : (
              <>
                <div className="space-y-2">
                  <h2 className="font-heading text-xl font-bold">
                    Giriş Yapın
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Kayıtlı e-posta adresiniz ve şifrenizle erişin
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs leading-relaxed">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label
                      htmlFor="email"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      E-Posta Adresi
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/50">
                        <User className="h-4 w-4" />
                      </span>
                      <input
                        id="email"
                        type="email"
                        placeholder="ornek@apartman.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="glass-input w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="password"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Şifre
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/50">
                        <KeyRound className="h-4 w-4" />
                      </span>
                      <input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="glass-input w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl text-sm font-semibold transition-all shadow-glow disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                  >
                    {loginMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="inline" />
                        <span>Giriş Yapılıyor...</span>
                      </>
                    ) : (
                      <span>Giriş Yap</span>
                    )}
                  </button>
                </form>

                <div className="flex flex-col gap-3 pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowJoinCode(true)}
                    className="text-xs text-primary hover:underline hover:text-primary/90 transition-all font-semibold"
                  >
                    Aktivasyon Koduyla Siteye Katıl
                  </button>
                  <div className="border-t border-white/[0.06] pt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Multi-Tenant apartman altyapısı aktiftir</span>
                  </div>
                </div>
              </>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
