/**
 * Documentation Filter
 * Sadece önemli detayları dokümante et - Doküman çöplüğüne çevirme
 */

export interface DocumentationDecision {
  shouldDocument: boolean;
  reason: string;
  priority: "critical" | "important" | "optional" | "skip";
}

/**
 * Dokümantasyon kararı ver
 * Sadece önemli/kritik değişiklikler dokümante edilir
 */
export function shouldDocument(
  changeType:
    | "system"
    | "feature"
    | "bugfix"
    | "refactor"
    | "routine"
    | "conversation",
  impact: "high" | "medium" | "low",
  isNewSystem: boolean = false
): DocumentationDecision {
  // KRİTİK: Yeni sistemler her zaman dokümante edilir
  if (isNewSystem) {
    return {
      shouldDocument: true,
      reason: "Yeni sistem - Kritik dokümantasyon gerekiyor",
      priority: "critical",
    };
  }

  // KRİTİK: Sistem değişiklikleri (yüksek etki)
  if (changeType === "system" && impact === "high") {
    return {
      shouldDocument: true,
      reason: "Sistem değişikliği - Yüksek etki",
      priority: "critical",
    };
  }

  // ÖNEMLİ: Yeni özellikler (yüksek/orta etki)
  if (changeType === "feature" && (impact === "high" || impact === "medium")) {
    return {
      shouldDocument: true,
      reason: "Yeni özellik - Dokümante edilmeli",
      priority: "important",
    };
  }

  // ÖNEMLİ: Kritik pattern'ler, kurallar
  if (changeType === "system" && impact === "medium") {
    return {
      shouldDocument: true,
      reason: "Sistem değişikliği - Orta etki",
      priority: "important",
    };
  }

  // OPSİYONEL: Bug fix'ler, refactor'lar (düşük etki)
  if (changeType === "bugfix" || changeType === "refactor") {
    return {
      shouldDocument: false,
      reason: "Rutin işlem - Dokümante edilmesi gerekmez",
      priority: "optional",
    };
  }

  // ATLA: Rutin işlemler, konuşmalar
  if (changeType === "routine" || changeType === "conversation") {
    return {
      shouldDocument: false,
      reason: "Rutin işlem/konuşma - Dokümante edilmemeli",
      priority: "skip",
    };
  }

  // Varsayılan: Dokümante etme
  return {
    shouldDocument: false,
    reason: "Düşük öncelikli değişiklik",
    priority: "skip",
  };
}

/**
 * Dokümantasyon kriterleri kontrolü
 */
export const DOCUMENTATION_CRITERIA = {
  CRITICAL: [
    "Yeni sistemler",
    "Kritik kurallar",
    "Sistem mimarisi değişiklikleri",
    "Güvenlik değişiklikleri",
    "Breaking changes",
  ],
  IMPORTANT: [
    "Yeni özellikler",
    "Önemli pattern'ler",
    "Workflow değişiklikleri",
    "MCP tool eklemeleri",
  ],
  SKIP: [
    "Rutin bug fix'ler",
    "Refactor'lar",
    "Kod temizleme",
    "Konuşma notları",
    "Geçici çözümler",
  ],
};
