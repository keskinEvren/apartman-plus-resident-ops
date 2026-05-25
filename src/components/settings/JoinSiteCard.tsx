import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { GlassCard } from "@/components/shared/GlassCard";
import { Link2, Sparkles } from "lucide-react";

export function JoinSiteCard() {
  const [tokenCode, setTokenCode] = useState("");

  const claimMutation = trpc.invitation.claimInvitation.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("active-site-id", data.siteId);
      localStorage.setItem("active-membership-id", data.membershipId);
      showToast(
        "success",
        "Aktivasyon kodu doğrulandı! Yeni siteye başarıyla katıldınız.",
      );
      setTokenCode("");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (err) => {
      showToast("error", err.message || "Geçersiz aktivasyon kodu!");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenCode.trim()) return;
    claimMutation.mutate({ token: tokenCode.trim().toUpperCase() });
  };

  return (
    <GlassCard className="gradient-border p-6 space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Link2 className="h-4 w-4 text-primary" />
        Davetiye Kodu ile Siteye Katıl
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Yönetim tarafından size iletilen 8 haneli tek kullanımlık **Aktivasyon
        Kodunu** girerek, site dairesine anında ve güvenli bir şekilde
        bağlanabilirsiniz.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-3 pt-2">
        <input
          type="text"
          placeholder="Örn: AP-X7R-9W2"
          value={tokenCode}
          onChange={(e) => setTokenCode(e.target.value)}
          className="glass-input flex-1 rounded-xl px-4 py-2.5 text-sm uppercase text-center font-bold tracking-wider"
          required
        />
        <button
          type="submit"
          disabled={claimMutation.isPending}
          className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition-all shadow-glow flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {claimMutation.isPending ? "Doğrulanıyor..." : "Doğrula & Katıl"}
        </button>
      </form>
    </GlassCard>
  );
}
