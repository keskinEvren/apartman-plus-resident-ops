import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { GlassCard } from "@/components/shared/GlassCard";
import { Shield, Plus, Check } from "lucide-react";

interface RoleManagerProps {
  siteId: string;
}

const AVAILABLE_PERMISSIONS = [
  { key: "CREATE_ANNOUNCEMENT", label: "Duyuru Yayınlama" },
  { key: "VIEW_READ_RECEIPTS", label: "Okunma Raporu İzleme" },
  { key: "MANAGE_TICKETS", label: "Tüm Talepleri Yönetme" },
  { key: "MANAGE_VISITORS", label: "Ziyaretçileri Yönetme" },
  { key: "MANAGE_PACKAGES", label: "Kargoları Yönetme" },
  { key: "VIEW_VISITORS", label: "Ziyaretçi Listesini Görme" },
  { key: "CHECK_IN_VISITORS", label: "Ziyaretçi Girişi Onaylama" },
  { key: "RECEIVE_PACKAGES", label: "Kargo Girişi Yapma" },
  { key: "DELIVER_PACKAGES", label: "Kargo OTP ile Teslim Etme" },
  { key: "VIEW_TICKETS", label: "Talepleri Görme (SLA)" },
  { key: "UPDATE_TICKETS", label: "Talep Durumu Güncelleme" },
];

export function RoleManager({ siteId }: RoleManagerProps) {
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const utils = trpc.useUtils();

  const { data: roles = [], isLoading } = trpc.site.listRoles.useQuery({ siteId });

  const createMutation = trpc.site.createRole.useMutation({
    onSuccess: () => {
      showToast("success", "Yeni dinamik rol başarıyla oluşturuldu!");
      setRoleName("");
      setSelectedPermissions([]);
      utils.site.listRoles.invalidate({ siteId });
    },
    onError: (err) => showToast("error", err.message || "Rol oluşturulamadı"),
  });

  const handleTogglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return showToast("error", "Lütfen geçerli bir rol adı girin");
    createMutation.mutate({ siteId, name: roleName.toUpperCase(), permissions: selectedPermissions });
  };

  return (
    <div className="space-y-6">
      <GlassCard className="gradient-border p-6 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-primary" />
          Yeni Dinamik Rol Tanımla
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Rol Adı</label>
            <input
              type="text"
              placeholder="Örn: CONCIERGE, GECE_GUVENLIGI"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground block">Yetkiler (Permissions)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {AVAILABLE_PERMISSIONS.map((p) => {
                const isChecked = selectedPermissions.includes(p.key);
                return (
                  <div
                    key={p.key}
                    onClick={() => handleTogglePermission(p.key)}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                      isChecked
                        ? "bg-primary/10 border-primary text-primary shadow-glow"
                        : "bg-white/[0.01] border-white/[0.04] text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{p.label}</span>
                    {isChecked && <Check className="h-3.5 w-3.5" />}
                  </div>
                );
              })}
            </div>
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition-all shadow-glow flex items-center justify-center gap-1 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Rolü Kaydet
          </button>
        </form>
      </GlassCard>

      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aktif Roller</h4>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roles.map((r) => (
              <GlassCard key={r.id} className="p-4 border border-white/[0.06] space-y-2">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  {r.name}
                </p>
                <div className="flex flex-wrap gap-1">
                  {r.permissions.map((p: string) => (
                    <span key={p} className="text-[9px] bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded text-muted-foreground">
                      {p}
                    </span>
                  ))}
                  {r.permissions.length === 0 && (
                    <span className="text-[9px] text-muted-foreground italic">Yetki tanımlanmamış (Kat Sakini vb.)</span>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
