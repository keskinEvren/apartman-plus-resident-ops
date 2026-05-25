import React from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { GlassCard } from "@/components/shared/GlassCard";
import { Users, User, Shield, Power } from "lucide-react";

interface MemberManagerProps {
  siteId: string;
  roles: any[];
}

export function MemberManager({ siteId, roles }: MemberManagerProps) {
  const utils = trpc.useUtils();

  const { data: members = [], isLoading: loadingMembers } =
    trpc.site.listMemberships.useQuery({ siteId });

  const updateMutation = trpc.site.updateMembership.useMutation({
    onSuccess: () => {
      showToast("success", "Üyelik başarıyla güncellendi!");
      utils.site.listMemberships.invalidate({ siteId });
    },
    onError: (err) => showToast("error", err.message || "Güncelleme başarısız"),
  });

  const handleRoleChange = (membershipId: string, roleId: string) => {
    updateMutation.mutate({ membershipId, roleId });
  };

  const handleToggleStatus = (membershipId: string, currentStatus: boolean) => {
    updateMutation.mutate({ membershipId, isActive: !currentStatus });
  };

  if (loadingMembers) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Users className="h-4 w-4 text-primary" />
        Site Sakinleri & Görevli Yönetimi
      </h3>

      <div className="space-y-3">
        {members.map((member) => (
          <GlassCard
            key={member.membershipId}
            className={`gradient-border p-4 transition-all duration-200 ${
              member.isActive
                ? "border-white/[0.06]"
                : "border-red-500/20 bg-red-950/5 opacity-75"
            }`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/[0.04] border border-white/[0.06] text-primary flex items-center justify-center shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {member.user?.fullName || "İsimsiz Kullanıcı"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {member.user?.email}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  <select
                    value={member.role?.id || ""}
                    onChange={(e) =>
                      handleRoleChange(member.membershipId, e.target.value)
                    }
                    disabled={updateMutation.isPending}
                    className="glass-input rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                  >
                    {roles.map((r) => (
                      <option
                        key={r.id}
                        value={r.id}
                        className="bg-[#121214] text-foreground"
                      >
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() =>
                    handleToggleStatus(member.membershipId, member.isActive)
                  }
                  disabled={updateMutation.isPending}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${
                    member.isActive
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                      : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                  }`}
                >
                  <Power className="h-3 w-3" />
                  {member.isActive ? "Aktif" : "Donduruldu"}
                </button>
              </div>
            </div>
          </GlassCard>
        ))}

        {members.length === 0 && (
          <GlassCard className="text-center py-12">
            <p className="text-sm font-semibold text-muted-foreground">
              Kayıtlı üye bulunamadı
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
