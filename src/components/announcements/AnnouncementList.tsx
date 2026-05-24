import React from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Megaphone, Calendar, User, Eye, AlertCircle } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  createdAt: Date;
  author?: {
    name: string | null;
  } | null;
}

interface AnnouncementListProps {
  announcements: Announcement[];
  isAdmin: boolean;
  onViewDetail: (id: string) => void;
  onViewReceipts: (id: string) => void;
}

const priorityLabels: Record<string, string> = {
  NORMAL: "Duyuru",
  IMPORTANT: "Önemli",
  URGENT: "Acil Durum",
};

const priorityColors: Record<string, string> = {
  NORMAL: "bg-blue-500/15 border-blue-500/20 text-blue-400",
  IMPORTANT: "bg-amber-500/15 border-amber-500/20 text-amber-400 shadow-glow",
  URGENT: "bg-red-500/15 border-red-500/20 text-red-400 shadow-glow animate-pulse",
};

const priorityGlows: Record<string, string> = {
  NORMAL: "border-white/[0.06]",
  IMPORTANT: "border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]",
  URGENT: "border-red-500/25 shadow-[0_0_20px_rgba(239,68,68,0.08)]",
};

export function AnnouncementList({
  announcements,
  isAdmin,
  onViewDetail,
  onViewReceipts,
}: AnnouncementListProps) {
  if (announcements.length === 0) {
    return (
      <GlassCard className="text-center py-12">
        <AlertCircle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm font-semibold text-muted-foreground">
          Yayınlanmış duyuru bulunamadı
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Siteniz için henüz bir duyuru paylaşılmamış.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {announcements.map((ann) => (
        <GlassCard
          key={ann.id}
          onClick={() => onViewDetail(ann.id)}
          className={`gradient-border hover:scale-[1.005] hover:bg-white/[0.03] transition-all duration-200 cursor-pointer ${
            priorityGlows[ann.priority] || priorityGlows.NORMAL
          }`}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-white/[0.04] border border-white/[0.06] text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Megaphone className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-base text-foreground truncate max-w-xl">
                    {ann.title}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      priorityColors[ann.priority] || priorityColors.NORMAL
                    }`}
                  >
                    {priorityLabels[ann.priority] || ann.priority}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1 max-w-2xl">
                  {ann.content}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(ann.createdAt).toLocaleDateString("tr-TR")}
                  </span>
                  {ann.author && (
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      Gönderen: {ann.author.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewReceipts(ann.id);
                }}
                className="w-full md:w-auto px-3.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-foreground rounded-lg text-xs font-semibold border border-white/[0.06] transition-all flex items-center justify-center gap-1.5"
              >
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                Okunma Raporu
              </button>
            )}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
