import React from "react";
import { PlusCircle } from "lucide-react";

interface TicketsHeaderProps {
  isStaff: boolean;
  blockName?: string | null;
  onOpenAdd: () => void;
}

export function TicketsHeader({ isStaff, blockName, onOpenAdd }: TicketsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Destek Talepleri</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isStaff
            ? `Rezidans sakinlerinden gelen talepleri izleyin ve SLA süresi içinde müdahale edin ${blockName ? `(${blockName} Sorumluluğu)` : ""}`
            : "Teknik arıza, temizlik veya güvenlik talebi oluşturun; ekibimiz anında müdahale etsin"}
        </p>
      </div>

      {!isStaff && (
        <button
          onClick={onOpenAdd}
          className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition-all shadow-glow flex items-center justify-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Yeni Talep Oluştur
        </button>
      )}
    </div>
  );
}
