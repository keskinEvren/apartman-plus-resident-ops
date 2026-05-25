"use client";

import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { LoginFormMfaSection } from "./LoginFormMfaSection";
import { User, KeyRound } from "lucide-react";

interface LoginFormCardProps {
  onSuccess: (data: { token: string; user: any; memberships: any[] }) => void;
  initialEmail?: string;
  initialPassword?: string;
  autofillTrigger?: number;
}

export function LoginFormCard({
  onSuccess,
  initialEmail = "",
  initialPassword = "",
  autofillTrigger = 0,
}: LoginFormCardProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [requireMfa, setRequireMfa] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialEmail && initialPassword) {
      setEmail(initialEmail);
      setPassword(initialPassword);
      setRequireMfa(false);
      setTempToken(null);
      setError("");
      loginMutation.mutate({ email: initialEmail, password: initialPassword });
    }
  }, [autofillTrigger]);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      if (data.requireMfa && data.tempToken) {
        setRequireMfa(true);
        setTempToken(data.tempToken);
        setError("");
        showToast("info", "İki aşamalı doğrulama kodu gerekli!");
      } else if (data.token) {
        onSuccess(data as any);
      }
    },
    onError: (err) => {
      setError(
        err.message || "Giriş başarısız, lütfen bilgilerinizi kontrol edin.",
      );
      showToast("error", err.message || "Giriş yapılamadı");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) return setError("E-posta ve şifre gereklidir.");
    loginMutation.mutate({ email, password });
  };

  const handleBack = () => {
    setRequireMfa(false);
    setTempToken(null);
    setError("");
  };

  return (
    <div className="space-y-6 text-xs text-foreground animate-fade-in">
      <div className="space-y-2">
        <h2 className="font-heading text-xl font-bold">
          {requireMfa ? "İki Aşamalı Doğrulama" : "Giriş Yapın"}
        </h2>
        <p className="text-xs text-muted-foreground">
          {requireMfa
            ? "Lütfen telefonunuzdaki Authenticator uygulamasından 6 haneli kodu girin."
            : "Kayıtlı e-posta adresiniz ve şifrenizle erişin"}
        </p>
      </div>

      {requireMfa && tempToken ? (
        <LoginFormMfaSection
          tempToken={tempToken}
          onSuccess={onSuccess}
          onBack={handleBack}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl leading-relaxed font-semibold">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              E-Posta Adresi
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/50">
                <User className="h-4 w-4" />
              </span>
              <input
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
            <label className="text-xs font-semibold text-muted-foreground">
              Şifre
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/50">
                <KeyRound className="h-4 w-4" />
              </span>
              <input
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
              <LoadingSpinner size="sm" />
            ) : (
              "Giriş Yap"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
