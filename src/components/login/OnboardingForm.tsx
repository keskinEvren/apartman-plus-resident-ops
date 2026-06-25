import React, { useState } from "react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { User, Mail, KeyRound } from "lucide-react";
import { showToast } from "@/components/shared/Toast";

interface OnboardingFormProps {
  invitationDetails: any;
  isPending: boolean;
  onSubmit: (
    mode: "REGISTER" | "LOGIN",
    name: string,
    email: string,
    pass: string,
  ) => void;
}

export function OnboardingForm({
  invitationDetails,
  isPending,
  onSubmit,
}: OnboardingFormProps) {
  const [mode, setMode] = useState<"REGISTER" | "LOGIN">("REGISTER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(invitationDetails.email || "");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "REGISTER") {
      if (!name.trim() || !email.trim() || !password) {
        return showToast("error", "Lütfen tüm alanları doldurun");
      }
    } else {
      if (!email.trim() || !password) {
        return showToast("error", "Lütfen tüm alanları doldurun");
      }
    }
    onSubmit(mode, name, email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
      <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl text-xs space-y-1.5">
        <p className="text-muted-foreground">Katılacağınız Site / Daire:</p>
        <p className="font-bold text-foreground text-sm">
          {invitationDetails.unit
            ? `${invitationDetails.unit.blockName} - ${invitationDetails.unit.unitNumber}`
            : "Birim Atanmamış (Görevli/Staff)"}
        </p>
        <span className="inline-block text-[10px] bg-muted border border-border px-2 py-0.5 rounded text-primary font-bold">
          Rol: {invitationDetails.role?.name}
        </span>
      </div>

      {/* Toggle Register/Login */}
      <div className="flex bg-muted/50 border border-border rounded-xl p-1 gap-1">
        <button
          type="button"
          onClick={() => setMode("REGISTER")}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
            mode === "REGISTER"
              ? "bg-primary text-primary-foreground font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Yeni Hesap Aç
        </button>
        <button
          type="button"
          onClick={() => setMode("LOGIN")}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
            mode === "LOGIN"
              ? "bg-primary text-primary-foreground font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Hesabıma Bağla
        </button>
      </div>

      {mode === "REGISTER" && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Adınız Soyadınız
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/50">
              <User className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Ahmet Yılmaz"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none"
              required
            />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          E-Posta Adresi
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/50">
            <Mail className="h-4 w-4" />
          </span>
          <input
            type="email"
            placeholder="ahmet@apartman.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none"
            disabled={!!invitationDetails.email}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
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
            className="input-field w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl text-sm font-semibold transition-all mt-2 flex items-center justify-center gap-1.5"
      >
        {isPending ? (
          <LoadingSpinner size="sm" />
        ) : (
          <span>
            {mode === "REGISTER"
              ? "Hesap Oluştur & Katıl"
              : "Hesabı Eşle & Giriş Yap"}
          </span>
        )}
      </button>
    </form>
  );
}
