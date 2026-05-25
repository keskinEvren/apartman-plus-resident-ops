import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { GlassCard } from "@/components/shared/GlassCard";
import { Building2, Plus, LayoutGrid, Layers } from "lucide-react";

interface PropertyManagerProps {
  siteId: string;
}

export function PropertyManager({ siteId }: PropertyManagerProps) {
  const [blockName, setBlockName] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [selectedBlockId, setSelectedBlockId] = useState("");

  const utils = trpc.useUtils();

  const { data: blocks = [], isLoading: loadingBlocks } =
    trpc.site.listBlocks.useQuery();
  const { data: units = [], isLoading: loadingUnits } =
    trpc.site.listUnits.useQuery();

  const blockMutation = trpc.site.createBlock.useMutation({
    onSuccess: () => {
      showToast("success", "Yeni blok başarıyla oluşturuldu!");
      setBlockName("");
      utils.site.listBlocks.invalidate();
    },
    onError: (err) => showToast("error", err.message || "Blok oluşturulamadı"),
  });

  const unitMutation = trpc.site.createUnit.useMutation({
    onSuccess: () => {
      showToast("success", "Yeni daire başarıyla oluşturuldu!");
      setUnitNumber("");
      utils.site.listUnits.invalidate();
    },
    onError: (err) => showToast("error", err.message || "Daire oluşturulamadı"),
  });

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockName.trim()) return;
    blockMutation.mutate({ siteId, name: blockName.toUpperCase() });
  };

  const handleCreateUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlockId || !unitNumber.trim()) return;
    unitMutation.mutate({
      blockId: selectedBlockId,
      unitNumber: unitNumber.toUpperCase(),
    });
  };

  if (loadingBlocks || loadingUnits) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Block Form */}
        <GlassCard className="gradient-border p-5 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-primary" />
            Yeni Blok Ekle
          </h3>
          <form onSubmit={handleCreateBlock} className="flex gap-3">
            <input
              type="text"
              placeholder="Örn: C BLOK"
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
              className="glass-input flex-1 rounded-xl px-4 py-2 text-sm"
              required
            />
            <button
              type="submit"
              disabled={blockMutation.isPending}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition-all shadow-glow flex items-center gap-1 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Blok Ekle
            </button>
          </form>
        </GlassCard>

        {/* Unit Form */}
        <GlassCard className="gradient-border p-5 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-primary" />
            Yeni Daire Ekle
          </h3>
          <form
            onSubmit={handleCreateUnit}
            className="flex flex-col sm:flex-row gap-3"
          >
            <select
              value={selectedBlockId}
              onChange={(e) => setSelectedBlockId(e.target.value)}
              className="glass-input rounded-xl px-3 py-2 text-sm flex-1"
              required
            >
              <option value="" className="bg-[#121214]">
                Blok Seçin
              </option>
              {blocks.map((b) => (
                <option key={b.id} value={b.id} className="bg-[#121214]">
                  {b.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Örn: NO 12"
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              className="glass-input rounded-xl px-4 py-2 text-sm flex-1"
              required
            />
            <button
              type="submit"
              disabled={unitMutation.isPending}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition-all shadow-glow flex items-center gap-1 shrink-0 justify-center"
            >
              <Plus className="h-4 w-4" />
              Daire Ekle
            </button>
          </form>
        </GlassCard>
      </div>

      {/* Property tree overview */}
      <GlassCard className="gradient-border p-6 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <LayoutGrid className="h-4 w-4 text-primary" />
          Sitedeki Blok ve Daireler
        </h3>

        <div className="space-y-4 pt-2 max-h-[350px] overflow-y-auto pr-2">
          {blocks.map((block) => {
            const blockUnits = units.filter((u) => u.blockName === block.name);
            return (
              <div
                key={block.id}
                className="space-y-2 border-b border-white/[0.04] pb-4 last:border-0 last:pb-0"
              >
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {block.name}
                </p>
                <div className="flex flex-wrap gap-2">
                  {blockUnits.map((u) => (
                    <span
                      key={u.id}
                      className="text-[10px] bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition px-3 py-1.5 rounded-lg text-muted-foreground font-semibold"
                    >
                      {u.unitNumber}
                    </span>
                  ))}
                  {blockUnits.length === 0 && (
                    <span className="text-[10px] text-muted-foreground/60 italic">
                      Bu blok için daire tanımlanmamış.
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
