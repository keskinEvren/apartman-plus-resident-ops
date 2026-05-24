import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { GlassCard } from "@/components/shared/GlassCard";
import { PlusCircle, Copy, Clock } from "lucide-react";

interface InvitationManagerProps {
  siteId: string;
  roles: any[];
  units: any[];
}

export function InvitationManager({ siteId, roles, units }: InvitationManagerProps) {
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const utils = trpc.useUtils();

  const { data: invitations = [], isLoading: loadingInv } =
    trpc.invitation.listInvitations.useQuery({ siteId });

  const createInvitationMutation = trpc.invitation.createInvitation.useMutation({
    onSuccess: () => {
      showToast("success", "Aktivasyon kodu başarıyla üretildi!");
      setSelectedUnitId("");
      setSelectedRoleId("");
      utils.invitation.listInvitations.invalidate({ siteId });
    },
    onError: (err) => showToast("error", err.message || "Kod üretilemedi"),
  });

  const handleGenerateCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoleId) return showToast("error", "Lütfen bir rol seçin");
    createInvitationMutation.mutate({
      siteId,
      roleId: selectedRoleId,
      unitId: selectedUnitId || null,
    });
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("success", "Kod panoya kopyalandı!");
  };

  if (loadingInv) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Invite Member Section */}
      <GlassCard className="gradient-border p-5 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <PlusCircle className="h-4 w-4 text-primary" />
          Yeni Sakin / Üye Davet Et (Aktivasyon Kodu Üret)
        </h3>
        <form onSubmit={handleGenerateCode} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Daire / Birim (Opsiyonel)</label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="glass-input rounded-xl px-3 py-2.5 text-xs w-full"
            >
              <option value="" className="bg-[#121214]">Daire Yok (Görevli/Staff)</option>
              {units.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#121214]">
                  {u.blockName} - {u.unitNumber}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Rol</label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="glass-input rounded-xl px-3 py-2.5 text-xs w-full"
              required
            >
              <option value="" className="bg-[#121214]">Rol Seçin</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id} className="bg-[#121214]">
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={createInvitationMutation.isPending}
            className="py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition-all shadow-glow flex items-center justify-center gap-1 w-full disabled:opacity-50"
          >
            Aktivasyon Kodu Üret
          </button>
        </form>
      </GlassCard>

      {/* Invitations Audit List */}
      {invitations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-primary" />
            Aktif Aktivasyon Kodları
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {invitations.map((inv) => (
              <GlassCard
                key={inv.id}
                className={`p-4 border space-y-2 flex flex-col justify-between ${
                  inv.isUsed ? "border-white/[0.04] bg-white/[0.01] opacity-60" : "border-primary/20 shadow-glow"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded text-muted-foreground font-semibold">
                      {inv.role?.name}
                    </span>
                    <p className="text-[10px] text-muted-foreground/80 mt-1">
                      {inv.unit ? `${inv.unit.blockName} - ${inv.unit.unitNumber}` : "Birim Atanmamış (Görevli)"}
                    </p>
                  </div>
                  {!inv.isUsed && (
                    <button
                      onClick={() => handleCopyToClipboard(inv.token)}
                      className="p-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.08]"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold font-mono text-foreground tracking-wider">{inv.token}</span>
                  <span className={`text-[9px] font-bold ${inv.isUsed ? "text-muted-foreground" : "text-emerald-400"}`}>
                    {inv.isUsed ? "Kullanıldı" : "Beklemede"}
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
