import { Wrench, Sparkles, Shield, HelpCircle } from "lucide-react";

export const categoryIcons: Record<string, any> = {
  TECHNICAL: Wrench,
  CLEANING: Sparkles,
  SECURITY: Shield,
  OTHER: HelpCircle,
};

export const categoryLabels = {
  TECHNICAL: "Teknik Arıza / Onarım",
  CLEANING: "Temizlik / Hijyen",
  SECURITY: "Güvenlik / Asayiş",
  OTHER: "Diğer",
};

export const statusLabels = {
  OPEN: "Açık",
  IN_PROGRESS: "İşlemde",
  RESOLVED: "Çözüldü",
  CANCELLED: "İptal Edildi",
};

export const statusColors = {
  OPEN: "bg-blue-500/15 border-blue-500/20 text-blue-400",
  IN_PROGRESS: "bg-amber-500/15 border-amber-500/20 text-amber-400",
  RESOLVED: "bg-emerald-500/15 border-emerald-500/20 text-emerald-400",
  CANCELLED: "bg-red-500/15 border-red-500/20 text-red-400",
};
